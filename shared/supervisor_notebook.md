# Supervisor Notebook

Durable, cross-workspace memory of observed failures, coordination anti-patterns,
their causes, and lessons. Every observed failure must yield a recorded lesson
or an explicit unresolved question, not another unexplained retry. This is not
a task tracker, transcript, project decision log, or source of new authority.

## Ownership and working method

- The Human owns the record. Supervisors may append operational observations
  without asking for approval for each entry. Lead and Peer report observations
  through their assigned owner; they do not write this memory by default.
- Append only. Never rewrite, delete, reorder, or silently correct earlier
  entries. Append a correction, recurrence, or resolution referencing the
  original episode. Re-read the tail before writing; coordinate a single writer
  if multiple Supervisors would append concurrently.
- Record the failure when observed, while its context is available. Do not wait
  for a complete explanation: write `unknown` for an unverified cause and append
  the findings later. Do not invent incidents from examples or reference images.
- Tie each entry to a concrete workspace episode, time with timezone, agent
  identity, and bounded evidence. Separate observation, counterevidence,
  diagnosis/hypotheses, and impact. Do not invent timing, costs, or conclusions.
- Investigate operational causes at that time using bounded, relevant checks:
  exact failing tool and sanitized inputs; error category; relevant environment
  variable presence; provider/authentication/quota status; actual Peer lifecycle;
  and whether Lead received the blocker. Do not dump credentials or the full
  environment, rerun project validation, or take over implementation.
- Repeated identical failures may share an episode: append new evidence and
  observed recurrence counts instead of copying whole errors. A distinct failure
  or changed cause needs its own context. Routine healthy status is not an entry.
- If quota, missing configuration, permissions, or a dead process explains a
  stall, surface the actionable blocker to Lead. Do not leave Lead waiting for
  work that cannot progress or repeat a failing call without a changed premise.
  Spending, credentials, configuration changes, or recovery outside the current
  mandate still require the appropriate Human authorization.
- Check existing instructions and the actual owning boundary before proposing
  more prose. Prefer a correction at the authority, information surface,
  environment, or integration owner over incident-specific rules and wrappers.
- Appending a lesson does not authorize applying it. Before changing profiles,
  protocols, or integration, brief the Human/project owner and obtain the
  required approval. Record what was actually authorized and executed.
- Evaluate an approved correction on the next comparable episode. Append its
  real result, counterevidence, and remaining risk; do not call a proposal fixed.
- At session start and before handling a similar failure, consult the relevant
  entries. Historical evidence is not current state: re-check volatile facts,
  such as agent IDs, environment, auth, and quota, before acting.
- Keep entries concise. Link to logs/artifacts rather than copying transcripts.
  Redact secrets, tokens, private payloads, and unnecessary account details.

## Entry format

Use this as a compact writing guide, not a validator or mandatory report schema.

```text
## <observed_at with timezone> — <short failure or pattern>
Episode / related entry:
Workspace / agents / scope:
Observation and evidence:
Counterevidence / what is not established:
Cause: <verified mechanism, or hypotheses and unknowns>
Impact: <observed delay, retries, usage, ownership or notification cost>
Action / authority: <taken, proposed, or blocked; approval when needed>
Lesson / next-time check:
Follow-up: <next evidence needed or comparison to evaluate the correction>
```

Append follow-ups as new entries identifying the original episode. Do not create
a second mutable pattern registry, status table, or duplicate project tracker.

## Entries
