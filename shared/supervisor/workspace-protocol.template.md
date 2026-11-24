# Workspace Protocol (template)

> Human owns this protocol; Supervisor drafts it with the Human and obtains
> approval before delegating affected work. Lead reads the approved protocol in
> full before orchestrating and excerpts relevant constraints into Peer briefs.
> Keep this file 100% project-specific — never duplicate global SLP prompt rules.

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
re-litigate or break them. Prune or mark superseded whenever a foundation changes.

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
- issue tracker (optional): `<GitHub Issues | Linear | none>` (never invent unread state; unread = `UNKNOWN`)
