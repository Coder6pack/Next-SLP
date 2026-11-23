# Known Limitations

- **Packaging scope:** Does not include credentials, personal
  `~/.codex/config.toml` baselines, runtime state, or real incident history in
  `supervisor_notebook.md`.
- **Version coupling:** Verified against Paseo `0.11.2` and Antigravity CLI
  `1.5.13`. Upgrading npm/Paseo overwrites the server patch; re-check with
  `python3 scripts/slp.py doctor` / `git apply --check` after any upgrade.
- **Operational guardrails, not an OS sandbox:** The server admission policy
  gates all Paseo agent-creation entry points, and
  `antigravity/hooks/slp-guard.mjs` (`PreToolUse`) hard-blocks native
  subagents/swarms/workflows, writes under `~/shared`, edits to files listed in
  `SLP_LOCKED_FILES`, and unattended `git push` when `SLP_ROLE` is set. However,
  seats still run with `--dangerously-skip-permissions` / `danger-full-access`,
  so these controls prevent coordination drift and accidental violations rather
  than isolating hostile code like an OS container/sandbox.
- **300,000-token auto-compact limit:** Enforced explicitly only for
  `codex-supervisor`; actual model context windows remain the hard ceiling.
  Antigravity seats rely on prompt context-hygiene guidance and runtime
  compaction behavior.
- **`~/shared` write protection:** Enforced at runtime for Antigravity via
  `slp-guard.mjs` (allowing append-only `supervisor_notebook.md` for
  Supervisors). For `codex-supervisor`, read-only `~/shared` discipline remains
  instruction-enforced unless paired with an equivalent Codex hook.
- **Automated test scope:** The test suite in `tests/` (also run in GitHub
  Actions CI) validates cross-file consistency, `scripts/slp.py render` and
  `check-live`, `codex-room`/`codex-room-sync` (concurrent isolation, recursion
  guard, stale runtime pruning), all branches of `slp-delegation-policy.js`,
  and all rules in `slp-guard.mjs`. CI does not run live E2E LLM inference.
