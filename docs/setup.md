# Setup

## Scope

This repository packages SLP configuration for audited, controlled installation
— there is no blind installer that overwrites your machine. Use
`scripts/slp.py render` to generate a host-specific bundle with resolved paths
before copying files into place, and use `scripts/slp.py check-live` to verify
zero drift before and after applying updates.

## Prerequisites

1. Paseo (verified snapshot: `0.11.2`), Codex CLI, Antigravity CLI (`agy`
   `1.5.13`), Bash, Node.js 22+, and Python 3.11+ (`tomllib`).
2. Authenticate Codex and Antigravity directly on the target machine. Never
   commit credentials to Git.
3. Run read-only host diagnostics and the full test suite:

```sh
python3 scripts/slp.py doctor
python3 scripts/slp.py verify
python3 -m unittest discover -s tests -v
node --test tests/test_*.mjs
```

4. Render a machine-ready bundle with resolved `HOME`, `node`, and `codex`
   paths (override with `--node-bin` / `--codex-bin` if needed):

```sh
python3 scripts/slp.py render --out dist/local-bundle --home "$HOME" --force
```

## Installing Files from `dist/local-bundle/`

Back up existing files and inspect diffs before copying:

| Source in `dist/local-bundle/` | Target on host |
| --- | --- |
| `codex/supervisor.config.toml` | `~/.codex/supervisor.config.toml` |
| `bin/codex-room` | `~/.local/bin/codex-room` |
| `bin/codex-room-sync` | `~/.local/bin/codex-room-sync` |
| `share/slp/paseo-projects.mjs` | `~/.local/share/slp/paseo-projects.mjs` |
| `share/slp/slp-guard.mjs` | `~/.local/share/slp/slp-guard.mjs` |
| `antigravity/agents/slp-*.md` | `~/.gemini/config/agents/` |
| `antigravity/hooks.json` | Merge `slp-role-guard` into `~/.gemini/config/hooks.json` |
| `antigravity/mcp_config.json` | Merge `mcpServers.paseo-projects` into `~/.gemini/config/mcp_config.json` |
| `shared/**` | `~/shared/` |

Notes:
- Do **not** overwrite `~/shared/supervisor/supervisor_notebook.md` if the host
  already has an active operational notebook.
- The `slp-role-guard` `PreToolUse` hook is a **no-op (`allow`)** whenever
  `SLP_ROLE` is unset, so regular non-SLP Antigravity sessions are unaffected.
- Your personal baseline `~/.codex/config.toml` stays on the host. At launch,
  `codex-room` creates an isolated runtime per instance at
  `~/.codex-runtime/supervisor/<PASEO_AGENT_ID>/`, so concurrent
  `codex-supervisor` instances never overwrite each other's `callerAgentId`.
  `codex-room-sync` automatically prunes stale runtime directories older than
  14 days (`SLP_RUNTIME_TTL_DAYS`, set to `0` to disable, or run
  `python3 scripts/slp.py prune` manually).
- `codex-room` detects and refuses recursive execution if `CODEX_BIN` points
  back to `codex-room`.

## Paseo Configuration

`dist/local-bundle/paseo/providers.json` is a fragment — do **not** replace
your entire `~/.paseo/config.json`. Merge `daemon.mcp`, `daemon.browserTools`,
and the 4 SLP entries under `agents.providers` into your existing config while
preserving network/relay settings and any non-SLP providers.

## Admission Patch

Locate the Paseo server dist directory (printed by `python3 scripts/slp.py doctor`)
and verify the patch cleanly before applying:

```sh
git apply --check /absolute/path/to/next-slp/patches/paseo-slp-admission.patch
```

- If an older SLP patch is already applied, reverse the old patch cleanly
  before applying the new one (never force-apply with `--reject` against a
  different Paseo build).
- Restart the Paseo daemon after patching when no active tasks are running.

## Post-Install Verification

- Run `python3 scripts/slp.py check-live` — every item should report `[MATCH]`.
- Smoke-test Codex runtime sync: `PASEO_AGENT_ID=smoke-test codex-room-sync supervisor`,
  inspect `~/.codex-runtime/supervisor/smoke-test/config.toml`, then remove the
  smoke-test directory.
- Run `paseo provider models <provider-id> --json` to confirm the live menu.
- Verify delegation boundaries: `agy-lead` → `agy-peer` succeeds for approved
  pairs, rejects out-of-menu models/efforts, rejects `detached` Peers, rejects
  non-SLP agents spawning SLP roles, and `agy-peer` has zero Paseo tools plus
  `slp-guard` blocking `self`/custom `invoke_subagent`, `swarm`, and `run_workflow`.
