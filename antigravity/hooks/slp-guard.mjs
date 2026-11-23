#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VALID_ROLES = new Set(["supervisor", "lead", "peer"]);
const NATIVE_ORCHESTRATION_TOOLS = new Set([
  "invoke_subagent",
  "define_subagent",
  "swarm",
  "run_workflow",
]);
const FILE_MUTATION_TOOLS = new Set(["write_file", "edit_file"]);

const GIT_PUSH_RE =
  /(?:^|[;&|()]\s*|\s)git\s+(?:-[A-Za-z](?:\s+\S+)?\s+|--[a-z-]+(?:=\S+)?\s+)*push(?:\s|$)/i;
const GH_EXTERNAL_MUTATION_RE =
  /(?:^|[;&|()]\s*|\s)gh\s+(?:pr\s+merge|release\s+create|repo\s+delete)(?:\s|$)/i;
const SHELL_MUTATION_RE =
  /(?:^|[;&|()]\s*|\s)(?:rm|mv|cp|tee|truncate|chmod|chown)\b|sed\s+-i|(?<!>)>(?!>)/i;
const SHELL_ANY_WRITE_RE =
  /(?:^|[;&|()]\s*|\s)(?:rm|mv|cp|tee|truncate|chmod|chown)\b|(?:sed|perl)\s+-i|>>?/i;

function safeRealpath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    return resolve(targetPath);
  }
}

function isInsideDir(targetPath, baseDir) {
  const rel = relative(baseDir, targetPath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function expandHome(rawPath, homeDir) {
  if (rawPath === "~") return homeDir;
  if (rawPath.startsWith("~/")) return join(homeDir, rawPath.slice(2));
  return rawPath;
}

function parseLockedEntries(rawLocked, cwd, homeDir) {
  if (typeof rawLocked !== "string" || !rawLocked.trim()) {
    return [];
  }
  return rawLocked
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((raw) => {
      const expanded = expandHome(raw, homeDir);
      const isBareName = !raw.includes("/") && !raw.includes("\\");
      const resolved = safeRealpath(isAbsolute(expanded) ? expanded : resolve(cwd, expanded));
      return { raw, isBareName, resolved };
    });
}

function findLockedMatch(resolvedTarget, lockedEntries) {
  for (const entry of lockedEntries) {
    if (isInsideDir(resolvedTarget, entry.resolved)) {
      return entry;
    }
    if (entry.isBareName && basename(resolvedTarget) === entry.raw) {
      return entry;
    }
  }
  return null;
}

function cmdMentionsLocked(cmd, lockedEntries) {
  for (const entry of lockedEntries) {
    if (cmd.includes(entry.resolved) || cmd.includes(entry.raw)) {
      return entry;
    }
  }
  return null;
}

function deny(reason) {
  return { decision: "deny", reason };
}

function allow() {
  return { decision: "allow" };
}

export function evaluatePreToolUse(payload, env = process.env) {
  const role = typeof env.SLP_ROLE === "string" ? env.SLP_ROLE.trim().toLowerCase() : "";
  if (!VALID_ROLES.has(role)) {
    return allow();
  }

  const toolName = String(payload?.toolCall?.name || "").trim();
  const args = payload?.toolCall?.args && typeof payload.toolCall.args === "object"
    ? payload.toolCall.args
    : {};
  const homeDir = resolve(env.HOME || homedir());
  const cwd = typeof payload?.cwd === "string" && payload.cwd ? payload.cwd : process.cwd();
  const sharedDir = safeRealpath(env.SLP_SHARED_DIR || join(homeDir, "shared"));
  const notebookPath = resolve(sharedDir, "supervisor", "supervisor_notebook.md");
  const lockedEntries =
    role === "peer" || role === "lead"
      ? parseLockedEntries(env.SLP_LOCKED_FILES, cwd, homeDir)
      : [];

  // 1. Block native orchestration bypasses for Peer and Lead.
  if ((role === "peer" || role === "lead") && NATIVE_ORCHESTRATION_TOOLS.has(toolName)) {
    if (role === "peer") {
      return deny(
        `SLP guard (peer): '${toolName}' is disabled; Peers cannot spawn or coordinate other agents.`
      );
    }
    return deny(
      `SLP guard (lead): '${toolName}' is disabled; Leads must delegate exclusively through Paseo create_agent.`
    );
  }

  // 2. Enforce ~/shared read-only boundary and SLP_LOCKED_FILES spec/test locks.
  if (FILE_MUTATION_TOOLS.has(toolName)) {
    const rawTarget = args.Path ?? args.path ?? args.TargetFile ?? args.file_path ?? "";
    if (typeof rawTarget === "string" && rawTarget.trim()) {
      const expanded = expandHome(rawTarget.trim(), homeDir);
      const resolvedTarget = safeRealpath(isAbsolute(expanded) ? expanded : resolve(cwd, expanded));
      if (isInsideDir(resolvedTarget, sharedDir)) {
        if (role === "supervisor" && resolvedTarget === notebookPath) {
          if (toolName === "write_file" && args.Append === true && args.Overwrite !== true) {
            return allow();
          }
          return deny(
            "SLP guard (supervisor): supervisor_notebook.md is append-only; use write_file with Append=true and Overwrite=false."
          );
        }
        return deny(
          `SLP guard (${role}): '${resolvedTarget}' is under read-only SLP shared directory '${sharedDir}'.`
        );
      }

      const lockedMatch = findLockedMatch(resolvedTarget, lockedEntries);
      if (lockedMatch) {
        return deny(
          `SLP guard (${role}): '${resolvedTarget}' is locked by SLP_LOCKED_FILES ('${lockedMatch.raw}') and cannot be modified.`
        );
      }
    }
  }

  // 3. Enforce external-action, ~/shared, and SLP_LOCKED_FILES shell boundaries for run_command.
  if (toolName === "run_command") {
    const cmd = String(args.CommandLine ?? args.command ?? "");
    const allowExternal = env.SLP_ALLOW_EXTERNAL_ACTIONS === "1";

    if (!allowExternal) {
      if (GIT_PUSH_RE.test(cmd)) {
        return deny(
          `SLP guard (${role}): unattended 'git push' is blocked; require explicit Human authorization.`
        );
      }
      if (GH_EXTERNAL_MUTATION_RE.test(cmd)) {
        return deny(
          `SLP guard (${role}): external GitHub mutation via 'gh' is blocked; require explicit Human authorization.`
        );
      }
    }

    const mentionsShared =
      cmd.includes(sharedDir) || /(?:^|[\s"'`=])(?:~|\$HOME|\$\{HOME\})\/shared(?:\b|\/)/.test(cmd);
    if (mentionsShared && SHELL_MUTATION_RE.test(cmd)) {
      return deny(
        `SLP guard (${role}): shell mutation targeting '${sharedDir}' is blocked.`
      );
    }

    const lockedCmdMatch = cmdMentionsLocked(cmd, lockedEntries);
    if (lockedCmdMatch && SHELL_ANY_WRITE_RE.test(cmd)) {
      return deny(
        `SLP guard (${role}): shell mutation targeting locked path '${lockedCmdMatch.raw}' (SLP_LOCKED_FILES) is blocked.`
      );
    }
  }

  return allow();
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const role = typeof process.env.SLP_ROLE === "string" ? process.env.SLP_ROLE.trim().toLowerCase() : "";
  if (!VALID_ROLES.has(role)) {
    process.stdout.write(`${JSON.stringify(allow())}\n`);
    return;
  }
  const raw = await readStdin();
  let payload;
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    process.stdout.write(`${JSON.stringify(deny("SLP guard: invalid PreToolUse JSON payload."))}\n`);
    return;
  }
  const result = evaluatePreToolUse(payload, process.env);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const isMain =
  process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isMain) {
  await main();
}
