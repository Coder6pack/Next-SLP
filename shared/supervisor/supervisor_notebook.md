# Supervisor Notebook

Append-only, cross-workspace operational memory of failures, coordination
anti-patterns, root causes, and follow-ups. Not a task tracker, transcript,
project decision log, or source of authority.

## Rules

- **Append-only:** Human owns this file; Supervisors hold standing append permission. Never rewrite, delete, or reorder prior entries — append corrections or resolutions referencing the original episode. Re-read the tail before writing.
- **Record while live:** Log failures when observed; write `unknown` for unverified causes rather than guessing or delaying. Skip routine healthy status.
- **Bounded, evidence-first diagnosis:** Tie each entry to workspace, timestamp+timezone, and agent IDs. Separate observation, counterevidence, cause, and impact. Inspect failing tools, error class, auth/quota, and seat lifecycle without dumping secrets or taking over Lead's validation/code.
- **Surface blockers, do not loop:** If quota, config, permission, or a dead seat stalls progress, surface it to Lead/Human rather than retrying unchanged calls.
- **Lesson != authorization:** Propose systemic fixes at the owning boundary (authority, tool surface, config) before adding prompt prose, and obtain Human approval before applying changes. Evaluate approved fixes on the next comparable episode.
- **Consult, then re-verify:** Check relevant entries at session start, but always re-verify volatile state (agent IDs, auth, quota) before acting.

## Entry format

```text
## <observed_at with timezone> — <short failure or pattern>
Episode / workspace / agents:
Observation & evidence:
Counterevidence / unknowns:
Cause & impact:
Action / authority:
Lesson & next-episode check:
```

## Entries
