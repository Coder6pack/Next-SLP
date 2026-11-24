# Workspace Protocol (template)

> Human owns this protocol; Supervisor drafts it with the Human and obtains
> approval before delegating affected work. Lead reads the approved protocol in
> full before orchestrating and excerpts relevant constraints into Peer briefs.
> Do **not** repeat global SLP rules already defined in role prompts or
> `paseo/providers.json` — keep this file 100% project-specific and concise.

## Status

- owner: <Human / project owner>
- status: <draft | approved>
- approval_record: <reference to Human approval; unset while draft>
- version: 1
- last_reviewed: YYYY-MM-DD
- applies_to: <repository root>

## Project profile & dominant risks

- criticality: <low | medium | high>
- dominant failure modes: <e.g., data corruption, cross-tenant leak, billing drift>
- expensive-to-reverse boundaries: <wire formats, DB migrations, auth, public APIs>
- forbidden external side effects: <pushes, deploys, production writes, spending>

## Active architecture decisions & invariants

Living index of non-obvious decisions still in force so future Leads do not
re-litigate or break them. Prune or mark superseded whenever a foundation
changes (keep details in `docs/learning-notes/`).

- `[YYYY-MM-DD]` <Decision> — <why, and what breaks if reversed>

## Authority boundaries

- Lead may decide: <scoped implementation, internal refactors, lane commits>
- Human must decide: <breaking API/schema changes, new dependencies, cost/security tradeoffs>
- Prohibited without explicit Human authorization: <push, release, delete data, external spend>

## Verification & contract locks

- standard verification: `<exact test / lint / typecheck commands>`
- high-risk verification: `<integration / fuzz / cross-model review triggers>`
- `SLP_LOCKED_FILES` (optional): `<comma-separated contract test or Spec.lean paths Peers must not edit>`
- formal verification (optional, `high-risk` cores only): `<none | lean4>` — when `lean4`, follow `__SLP_HOME__/shared/lead/formal-verification.md`

## Brief & repo discipline

- Writable Peers exercise judgment inside scope; do not pause to offer menus of options — escalate only genuine cross-boundary blockers as a single concrete question.
- Review briefs provide the frozen candidate, governing constraints, and an open question without revealing Lead's preferred answer.
- Issue tracker: `<GitHub Issues | Linear | none>` — who may create/close issues. Never invent unread tracker state (unread = `UNKNOWN`).
- Plans: keep only active plans; delete completed plan files after merge/push.

## Project-specific anti-patterns (optional)

- signal / required evidence / allowed response: <leave blank if none yet>

## Protocol evolution

- Human approves material authority or invariant changes (bump `version` and `last_reviewed`).
- Operational failures and cross-workspace lessons belong in `__SLP_HOME__/shared/supervisor/supervisor_notebook.md`, not here.
