# Shared SLP Reference Library

On-demand reference documents grouped by audience. **Do not preload this library
or read this index on every task** — role prompts link directly to the specific
document needed for a given situation.

## Access rules

- Owned by the Human. Treat `__SLP_HOME__/shared` as read-only unless the Human
  explicitly assigns an update.
- Standing exception: Supervisors may append operational observations to
  `supervisor/supervisor_notebook.md` (append-only; never rewrite prior entries).
- Reference documents never grant new authority, enable disabled tools, or
  override the Human's approved scope or `paseo/providers.json`.

## Directory map

| Path | Audience | When to read |
| --- | --- | --- |
| [supervisor/supervisor_notebook.md](supervisor/supervisor_notebook.md) | Supervisor | Session start when relevant, or when recording an observed failure / follow-up. |
| [supervisor/workspace-protocol.template.md](supervisor/workspace-protocol.template.md) | Human + Supervisor | Drafting a project-specific `workspace-protocol.md` for `high-risk` / long-lived workspaces. |
| [lead/handoff.md](lead/handoff.md) | Supervisor, Lead | Real ownership/context transitions, Peer replacement, or Human-mandated Lead replacement. |
| [lead/anti-patterns.md](lead/anti-patterns.md) | Supervisor, Lead | Diagnosing concrete coordination friction. |
| [lead/audit.md](lead/audit.md) | Lead (on demand) | Explicitly assigned audit of a behavioral claim and its proof. |
| [lead/catalog.md](lead/catalog.md) | Lead (on demand) | Search lenses supporting a proof-debt audit. |
| [lead/formal-verification.md](lead/formal-verification.md) | Lead (on demand) | Opt-in Lean 4 formal verification workflow and acceptance gate for `high-risk` cores. |
| [guides/learning-documents.md](guides/learning-documents.md) | Lead, Peer (when requested) | Writing and checking learning notes on `standard` / `high-risk` implementation tasks. |
