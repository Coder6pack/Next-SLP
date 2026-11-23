# Next-SLP

A structured **SLP (`Supervisor → Lead → Peer`)** multi-agent orchestration kit
for Paseo, built around a **single source of truth**, two-layer enforcement
(Paseo server admission gate + Antigravity `PreToolUse` guard hook), and
task-size routing (`tiny` / `standard` / `high-risk`).

## Role Menu

| Role | Provider | Model / thinking effort |
| --- | --- | --- |
| Supervisor | `codex-supervisor` | `gpt-6.1-sol` (default `medium`), `gpt-6-astra` |
| Supervisor | `agy-supervisor` | `gemini-4-neon` (`low` / `medium` / `high`, default `medium`) |
| Lead | `agy-lead` | `gemini-4-neon` (`high`, default), `gemini-4-hydrogen` (`high`, fallback) |
| Peer | `agy-peer` | `gemini-4-neon` (`high` / `xhigh`), `gemini-4-hydrogen` (`high` / `xhigh`) |

The live menu, `env.SLP_ROLE` tags, and `paseoTools` policies are defined once
in [paseo/providers.json](paseo/providers.json). `scripts/slp.py build` syncs
the menu into prompts, Codex TOML, and the Paseo admission patch, and automated
tests + CI verify zero drift.

## Repository Layout

```text
prompts/                         Single source of truth for the 3 role prompts (supervisor/lead/peer)
paseo/providers.json             Provider fragment: env.SLP_ROLE, model/effort menu, and paseoTools policy
paseo/mcp/paseo-projects.mjs     Portable read-only MCP server listing registered Paseo projects
codex/supervisor.overlay.toml    Codex Supervisor config overlay (no duplicated prompt text)
codex/supervisor.config.toml     Generated from overlay + prompts/supervisor.md
codex/bin/                       codex-room (PASEO_AGENT_ID isolation) & codex-room-sync (+ stale runtime GC)
antigravity/agents/              Generated from prompts/*.md with agent frontmatter
antigravity/hooks/               PreToolUse guard (slp-guard.mjs) blocking native subagents, ~/shared writes, git push
antigravity/hooks.json           Hook fragment for ~/.gemini/config/hooks.json
antigravity/mcp_config.json      MCP fragment (paseo-projects) for ~/.gemini/config/mcp_config.json
shared/                          Audience-scoped on-demand reference library (supervisor/lead/guides)
patches/                         Admission policy (slp-delegation-policy.js) + Paseo 0.11.2 server patch
scripts/slp.py                   CLI: build, verify, render, doctor, check-live, prune
tests/                           Unit tests for consistency, admission policy, slp-guard, codex-room-sync
docs/                            Controlled setup guide and known limitations
```

## Quick Commands

```sh
# 1. Rebuild generated artifacts from single sources (after editing prompts/, providers.json, or policy)
python3 scripts/slp.py build

# 2. Verify cross-file consistency and run all unit tests
python3 scripts/slp.py verify
python3 -m unittest discover -s tests -v
node --test tests/test_*.mjs

# 3. Inspect host binaries, patch status, and live config drift (read-only)
python3 scripts/slp.py doctor
python3 scripts/slp.py check-live

# 4. Render a machine-ready bundle with resolved host paths (never overwrites host files)
python3 scripts/slp.py render --out dist/local-bundle --home "$HOME" --force

# 5. Clean up stale ~/.codex-runtime instance directories (use --dry-run to preview)
python3 scripts/slp.py prune --days 14 --dry-run
```

## Key Design Points

- **Task-size routing:** `tiny` (1–2 files, no `workspace-protocol.md` or learning note), `standard` (use existing approved protocol or defaults in the brief + concise 5-section learning note), `high-risk` (requires Human-approved `workspace-protocol.md` before delegating).
- **Zero Paseo Tools & No Protocol Leak for Peers:** `agy-peer` sets `paseoTools.enabled = false` (removing all Paseo orchestration tools at the server layer to cut prompt schema overhead and block `send_agent_prompt` / `kill_agent` / `create_agent`), and the Peer prompt never links to Lead/Supervisor coordination docs.
- **Two-layer enforcement (Paseo Server + Antigravity `PreToolUse` Hook):**
  - Admission gate derives roles dynamically from `env.SLP_ROLE` in `config.json`: blocks `Peer` from creating agents, blocks non-SLP agents from spawning SLP roles, restricts `Lead` to non-detached `Peer` providers in menu, and restricts `Supervisor` to approved `Lead`/`Supervisor` pairs.
  - `slp-guard.mjs` (`PreToolUse`, no-op when `SLP_ROLE` is unset): hard-blocks `Peer` and `Lead` from calling native `invoke_subagent` / `define_subagent` / `swarm` / `run_workflow`, enforces read-only `~/shared` (except append-only `supervisor_notebook.md` for `Supervisor`), and blocks unattended `git push` / `gh pr merge` / `gh release create` / `gh repo delete`.
- **Resilience & routing:** `agy-lead` includes a `gemini-4-hydrogen/high` fallback; Lead uses an explicit `high` vs `xhigh` routing rubric, prefers **cross-model review** (`gemini-4-neon` ↔ `gemini-4-hydrogen`), and enforces context hygiene (~45% compact/rotate).
- Contains no credentials, tokens, personal Codex baselines, or real incident logs.

Read [docs/setup.md](docs/setup.md) and [docs/limitations.md](docs/limitations.md) before installing.
