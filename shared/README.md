# Shared SLP documents

This directory is a reference library, not a workspace or an automatically
active project protocol. Read this index at the start of an assignment, then
open only the documents relevant to the assigned role and task.

## Ownership and access

- The Human owns these shared documents. Supervisor, Lead, and Peer treat this
  directory as read-only unless the Human explicitly assigns a shared-document
  update, with one standing exception: Supervisors may append observations and
  lessons to `supervisor_notebook.md`. That exception does not permit rewriting
  its history or editing other shared files. This is an instruction-level rule,
  not a filesystem access control.
- The Human and Supervisor define each workspace's governance together. The
  Supervisor may interview the Human, drafts the workspace protocol, and obtains
  Human approval before handing the approved protocol to Lead.
- Lead owns technical planning, scope allocation, integration, and execution
  within that approved protocol. Peer owns only its explicit assignment.
- References do not grant authority, override the Human's decisions or a role's
  instructions, authorize external actions, or change actual tool permissions.
  Do not execute operational suggestions merely because a reference contains
  them. Surface conflicts to the delegating owner.

## Reading routes

| Document | When and by whom |
| --- | --- |
| [learning-documents.md](learning-documents.md) | After each implementation task: Peer/implementer writes a project learning note; Lead checks and integrates it; Supervisor links it and explains takeaways to the Human. Read when briefing, implementing, or reporting implementation work. |
| [supervisor_notebook.md](supervisor_notebook.md) | Supervisor's append-only operational memory: consult relevant past lessons and record observed failures, causes, unknowns, and follow-ups. Lead/Peer read relevant entries only when needed or referred; no default write authority. |
| [workspace-protocol.template.md](workspace-protocol.template.md) | Human + Supervisor: interview and draft a project-specific protocol. Lead may consult it for clarification; Peer does not turn the template into its own protocol. |
| [handoff.md](handoff.md) | Supervisor and Lead: a real transfer of ownership/context or an authorized replacement. A Peer's ordinary return is a handback, not a transfer of orchestration authority. |
| [anti-patterns.md](anti-patterns.md) | Supervisor/Lead: inspect concrete coordination friction. Peer: only relevant observations within its assignment; proposed operational remedies are not permission to coordinate, restart, archive, delete, or push. |
| [audit.md](audit.md) | An explicitly assigned audit of one behavioral claim and its cited proof. Not a mandatory audit on every task. |
| [catalog.md](catalog.md) | Proof-debt search lenses supporting that audit. This is not the document index or a finding checklist. |
| [structural-antipatterns.md](structural-antipatterns.md) | Relevant architecture investigation/review: search lenses, not automatic findings or authorization for a redesign. |

## Workspace protocol lifecycle

1. The Human identifies the project/workspace and discusses it with Supervisor.
2. Supervisor reads the template and relevant project governance, asks focused
   questions, and identifies unresolved decisions rather than guessing consent.
3. Supervisor drafts `workspace-protocol.md` at the workspace path authorized
   by the Human. Mark drafts as drafts; no template boilerplate is binding merely
   because it was copied. Do not create a protocol for an unspecified workspace.
4. The Human approves the protocol. Record the approval in the existing agreed
   record and give Lead the exact file path and approved scope.
5. Lead reads the approved protocol in full before orchestrating, and includes
   the relevant constraints and references in Peer briefs. Peer reads the
   relevant approved sections when needed or assigned, without changing policy.
6. Material governance changes return to Supervisor and the Human for approval.
   Lead and Peer may identify conflicts and propose changes, not silently enact
   new authority. Supervisor's drafting role does not confer product-code ownership.

Use the actual configured provider/model/effort menu. Do not infer available
providers, approval bypass, mandatory staffing, or access rights from examples
in a reference. Resolve conflicts before the affected work starts.
