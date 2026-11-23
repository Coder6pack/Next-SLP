# Workspace Protocol (template)

> The Human/project owner owns the workspace protocol. The Human and Supervisor
> develop it together; Supervisor may interview the Human and drafts
> `workspace-protocol.md` in the workspace location authorized by the Human.
> Obtain Human approval before handing it to Lead. Lead reads the approved
> protocol in full before orchestrating and excerpts relevant constraints into
> Peer briefs. Peer may read relevant approved sections when needed or assigned,
> but does not acquire governance or orchestration authority.
>
> This is a drafting scaffold, not an active protocol. Discuss and customize
> its proposed rules with the Human; unresolved decisions remain explicit.
> Do not silently activate example staffing, access modes, tools, or thresholds.

## Status

- owner: <Human/project owner>
- drafter: <Supervisor working with the Human>
- status: <draft | approved>
- approval_record: <existing agreed record of Human approval; unset while draft>
- version: 1
- last_reviewed: YYYY-MM-DD
- applies_to: <repository root>
- readers: Human and Supervisor; Lead in full before orchestration; Peer as relevant to its brief

## Project characteristics

- criticality:
- dominant risks:
- expensive-to-reverse decisions:
- external side effects:

## Authority

- Lead may decide:
- Human must decide:
- prohibited without explicit authority:

## Issue tracker

Optional. Name the tracker this repository uses, or write `none`.

- tracker: <GitHub Issues | none>
- who may create or close issues:

With `none`, the Lead's brief is the only record of scope, and the closing
report is the only record of outcome. Never let a seat invent tracker state:
an issue that was never read is `UNKNOWN`, not open or closed.

## Task classes

### Tiny (1–2 files, bounded, low risk)

- no separate protocol ceremony required; constraints live in the brief
- one Peer implementer; targeted verification; Lead verifies directly on handback
- independent Reviewer optional; learning note skipped unless requested

### Standard (cross-module / feature / non-trivial bugfix)

- Lead splits non-overlapping scopes across Peer(s); read-only Architect when boundaries are unclear
- one independent Reviewer on a stable candidate when material uncertainty exists
- concise Vietnamese learning note (5 headings) per `shared/guides/learning-documents.md`

### High-risk / Architecture lock-in

- Human-approved `workspace-protocol.md` required before delegating affected work
- sealed Architect and Reviewer mandates ("dual design / dual review":
  two independent seats across approved models, one frozen candidate,
  distinct mandates, when required by the approved protocol)
- compare alternatives and reversal conditions
- Lead issues one binding technical verdict; Human decides irreversible product/cost trade-offs
- thorough Vietnamese learning note documenting tradeoffs and reversal risks

## Ownership and workspaces

- one writer per moving scope
- concurrent writers require separate worktrees
- no overlapping ownership
- review only a stable candidate
- define handback and integration owner

## Routing

- pin the per-role routing for THIS repo (provider / model / effort /
  access mode), e.g. "Lead: <...>; implementation and
  review-remediation owners: <...> in full-access; review seats:
  <...>" — the Lead must not re-derive routing per task
- inspect currently available providers/models
- bounded familiar work: an approved model/effort pair appropriate to the task
- lifecycle/ownership work: strong reasoning model
- monitoring: economical model when risk permits

## Brief discipline

- every writable-owner brief must explicitly forbid stopping to offer
  the Lead a menu of implementation options; the owner exercises its
  own judgment inside its scope. A genuinely cross-boundary decision
  is a single short, concrete yes/no approval question — never an
  option-selection ritual
- council and review briefs are short and sufficient, never reveal or
  hint at the Lead's preferred answer, and never pre-solve; for
  reviews, do not narrow the review dimensions or otherwise anchor the
  seats — give the stable artifact, governing constraints, and the
  open question

## Context budget

- after a long-context owner hands back, if its context consumption
  exceeds ~45% of the model window, compact that owner before further
  work or start a fresh owner when clean context is the safer
  continuation; preserve ownership truth and durable handback
  artifacts across either transition — never silently continue a
  context-heavy owner

## Ultra-review gate

- ultra-review runs outside the room (human session), never as a seat
- do not run it after every slice or remediation; default is one run
  at plan closure
- mid-plan runs only at a stable checkpoint that completes an
  end-to-end capability, freezes a dependency foundation, or crosses a
  hard-to-reverse wire/storage/migration/ownership/security boundary
- never on unfinished composition, pending validation, or known later
  work
- after findings: focused Peer follow-up through the Lead; re-run only
  for a materially new convergence claim
- brief active peers only at handback, never by interrupting them

## Escalation

- CHALLENGE: a recorded choice or premise fails on evidence
- DECISION_REQUEST: another owner/API/scope or a decision outside the
  assignee's authority is required
- BLOCKED: authority, prerequisite, external state, or user decision missing

## Verification

- exact checks by task class
- candidate identity requirements
- independent-review triggers
- subjective evidence requirements

## Project-specific anti-patterns

- signal:
- evidence required:
- open question:
- allowed response:

## Documentation discipline

- record only non-obvious decisions — never what the code already
  shows (example of a worthy entry: "sessions live in Redis, not
  MySQL, because X" — so a later reviewer doesn't suggest migrating
  them back)
- keep only active plans; delete completed plans after commit+push
  (leftover plans pollute later agents' searches)
- tiny tasks skip the plan step entirely
- the protocol may pin the exact tool + params the Lead uses to create
  agents here, so the Lead doesn't re-derive it per task

## Protocol evolution

- Human and Supervisor discuss changes; Supervisor drafts governance updates
- Lead and Peer raise conflicts and proposals through their assigned owner
- Supervisor appends operational failures, causal evidence, and lessons to
  `__SLP_HOME__/shared/supervisor/supervisor_notebook.md`; keep project decisions and task
  state in the workspace's existing designated records
- Human approves material authority changes
- preserve version history
- review after a repeated pattern or major architecture change
