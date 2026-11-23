import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluatePreToolUse } from "../antigravity/hooks/slp-guard.mjs";

const BASE_ENV = { HOME: "/opt/example-home" };

describe("slp-guard PreToolUse hook", () => {
  it("is a no-op when SLP_ROLE is unset (normal Antigravity sessions)", () => {
    const res = evaluatePreToolUse(
      { toolCall: { name: "invoke_subagent", args: { TypeName: "research" } } },
      BASE_ENV
    );
    assert.equal(res.decision, "allow");
  });

  it("blocks native subagent, swarm, and workflow tools for Peer and Lead", () => {
    for (const role of ["peer", "lead"]) {
      for (const tool of ["invoke_subagent", "define_subagent", "swarm", "run_workflow"]) {
        const res = evaluatePreToolUse(
          { toolCall: { name: tool, args: {} } },
          { ...BASE_ENV, SLP_ROLE: role }
        );
        assert.equal(res.decision, "deny", `${role} must be blocked from ${tool}`);
      }
    }
  });

  it("protects ~/shared from edits by Peer, Lead, and Supervisor (except notebook append)", () => {
    const sharedFile = "/opt/example-home/shared/lead/handoff.md";
    const notebook = "/opt/example-home/shared/supervisor/supervisor_notebook.md";

    for (const role of ["peer", "lead", "supervisor"]) {
      const res = evaluatePreToolUse(
        { toolCall: { name: "edit_file", args: { Path: sharedFile } } },
        { ...BASE_ENV, SLP_ROLE: role }
      );
      assert.equal(res.decision, "deny");
    }

    // Supervisor can append to supervisor_notebook.md, but cannot overwrite or edit prior entries.
    assert.equal(
      evaluatePreToolUse(
        { toolCall: { name: "write_file", args: { Path: notebook, Append: true } } },
        { ...BASE_ENV, SLP_ROLE: "supervisor" }
      ).decision,
      "allow"
    );
    assert.equal(
      evaluatePreToolUse(
        { toolCall: { name: "write_file", args: { Path: notebook, Overwrite: true } } },
        { ...BASE_ENV, SLP_ROLE: "supervisor" }
      ).decision,
      "deny"
    );
    assert.equal(
      evaluatePreToolUse(
        { toolCall: { name: "edit_file", args: { Path: notebook } } },
        { ...BASE_ENV, SLP_ROLE: "supervisor" }
      ).decision,
      "deny"
    );

    // Peer cannot even append to supervisor_notebook.md.
    assert.equal(
      evaluatePreToolUse(
        { toolCall: { name: "write_file", args: { Path: notebook, Append: true } } },
        { ...BASE_ENV, SLP_ROLE: "peer" }
      ).decision,
      "deny"
    );

    // Normal repo edits are allowed.
    assert.equal(
      evaluatePreToolUse(
        { toolCall: { name: "edit_file", args: { Path: "/opt/example-home/dev/app/index.ts" } } },
        { ...BASE_ENV, SLP_ROLE: "peer" }
      ).decision,
      "allow"
    );
  });

  it("blocks unattended git push and gh merge/release mutations unless explicitly overridden", () => {
    for (const cmd of [
      "git push origin main",
      "git -C /repo push --force-with-lease",
      "gh pr merge 42 --squash",
      "gh release create v1.0.0",
      "rm -rf ~/shared/lead",
    ]) {
      assert.equal(
        evaluatePreToolUse(
          { toolCall: { name: "run_command", args: { CommandLine: cmd } } },
          { ...BASE_ENV, SLP_ROLE: "lead" }
        ).decision,
        "deny",
        `expected deny for: ${cmd}`
      );
    }

    // Read-only git and local tests remain allowed.
    for (const safeCmd of ["git status", "git commit -m 'feat'", "npm test", "cat ~/shared/lead/handoff.md"]) {
      assert.equal(
        evaluatePreToolUse(
          { toolCall: { name: "run_command", args: { CommandLine: safeCmd } } },
          { ...BASE_ENV, SLP_ROLE: "peer" }
        ).decision,
        "allow",
        `expected allow for: ${safeCmd}`
      );
    }

    // Explicit Human override permits git push.
    assert.equal(
      evaluatePreToolUse(
        { toolCall: { name: "run_command", args: { CommandLine: "git push origin main" } } },
        { ...BASE_ENV, SLP_ROLE: "lead", SLP_ALLOW_EXTERNAL_ACTIONS: "1" }
      ).decision,
      "allow"
    );
  });

  it("enforces SLP_LOCKED_FILES for Peer and Lead across file tools and shell writes", () => {
    const env = {
      ...BASE_ENV,
      SLP_ROLE: "peer",
      SLP_LOCKED_FILES: "Spec.lean, tests/contract.test.ts, formal/specs",
    };
    const cwd = "/opt/example-home/dev/app";

    // Blocked edits: bare filename anywhere, relative file path, and file inside locked dir.
    for (const target of [
      "/opt/example-home/dev/app/formal/Spec.lean",
      "tests/contract.test.ts",
      "/opt/example-home/dev/app/formal/specs/Invariants.lean",
    ]) {
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "edit_file", args: { Path: target } } }, env).decision,
        "deny",
        `expected deny editing ${target}`
      );
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "write_file", args: { Path: target } } }, env).decision,
        "deny",
        `expected deny writing ${target}`
      );
    }

    // Blocked shell writes targeting locked paths.
    for (const cmd of [
      "echo 'axiom hack : False' >> formal/Spec.lean",
      "sed -i '' 's/old/new/' tests/contract.test.ts",
      "rm -f formal/specs/Invariants.lean",
    ]) {
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "run_command", args: { CommandLine: cmd } } }, env).decision,
        "deny",
        `expected deny shell cmd: ${cmd}`
      );
    }

    // Allowed: reading/building locked specs and editing unlocked implementation/proof files.
    for (const safeCmd of ["cat formal/Spec.lean", "lake build", "npm test", "cat < formal/Spec.lean"]) {
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "run_command", args: { CommandLine: safeCmd } } }, env).decision,
        "allow",
        `expected allow shell cmd: ${safeCmd}`
      );
    }
      assert.equal(
        evaluatePreToolUse(
          { cwd, toolCall: { name: "edit_file", args: { Path: "/opt/example-home/dev/app/formal/Proof.lean" } } },
          env
        ).decision,
        "allow"
      );
  });

  it("blocks Supervisor from editing product files while allowing workspace-protocol.md and artifacts", () => {
    const env = { ...BASE_ENV, SLP_ROLE: "supervisor" };
    const cwd = "/opt/example-home/dev/app";

    for (const blockedTarget of [
      "/opt/example-home/dev/app/src/index.ts",
      "README.md",
      "package.json",
      "/opt/example-home/shared/supervisor/workspace-protocol.md",
    ]) {
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "edit_file", args: { Path: blockedTarget } } }, env).decision,
        "deny",
        `Supervisor must be blocked from editing ${blockedTarget}`
      );
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "write_file", args: { Path: blockedTarget } } }, env).decision,
        "deny",
        `Supervisor must be blocked from writing ${blockedTarget}`
      );
    }

    // Empty path on file mutation is also denied for Supervisor.
    assert.equal(
      evaluatePreToolUse({ cwd, toolCall: { name: "write_file", args: {} } }, env).decision,
      "deny"
    );

    // Allowed Supervisor writes: workspace-protocol.md (outside ~/shared) and Antigravity brain artifacts.
    for (const allowedTarget of [
      "workspace-protocol.md",
      "/opt/example-home/dev/app/docs/workspace-protocol.md",
      "/opt/example-home/.gemini/antigravity/brain/conv-123/plan.md",
    ]) {
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "write_file", args: { Path: allowedTarget } } }, env).decision,
        "allow",
        `Supervisor should be allowed to write ${allowedTarget}`
      );
      assert.equal(
        evaluatePreToolUse({ cwd, toolCall: { name: "edit_file", args: { Path: allowedTarget } } }, env).decision,
        "allow",
        `Supervisor should be allowed to edit ${allowedTarget}`
      );
    }
  });
});
