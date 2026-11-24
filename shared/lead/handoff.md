# Handoff — state and authority transitions

> Read by Lead (Peer transitions) and Supervisor (Human-mandated Lead
> replacement). Peers do not read this file; Peers return handbacks directly in
> their final message unless Lead requests a file.

## Compact, branch, or hand off?

| Situation | Action | Owner |
| --- | --- | --- |
| Context heavy (~45%+), same owner/goal, linear mental model | **Compact** | Current owner |
| Large unexpected dependency mid-lane | **Branch** to a separate Peer/Lead; merge back on handback | Lead / Supervisor |
| Owner/model changes, polluted context, or independent fresh review | **Handoff** with structured packet | Lead (Peer) / Supervisor (Lead) |
| Lead unrecoverable | **Lead replacement** (Human mandate + break-before-make) | Human decides, Supervisor executes |

Fresh session for independence, compact for continuity; a fork is not a clean room.

## Handoff packet

Pass the packet as the successor's first prompt — never say "read the old
transcript and continue". Stamp volatile runtime facts (agent IDs, branches,
daemon state) with `verified_at`.

```text
HANDOFF
From / To:
Authority transferred / retained:
Objective & current state:
Closed decisions (and owner):
Candidate / exact artifact identity:
Active agents / worktrees (verified_at):
Checks & real results:
Known failed approaches (do not repeat):
Open blockers & next permitted action:
```

## Break-before-make (zero split-brain)

Never run two writers on the same moving scope "for safety". Execute Lead
replacement strictly in order:

1. Freeze new delegation.
2. Checkpoint the old Lead if it can still respond.
3. Revoke/archive the old seat (prove revocation before continuing).
4. Spawn the successor Lead with the handoff packet.
5. Reconcile surviving Peers/worktrees/artifacts.
6. Re-enable writes.

Log one durable receipt in `__SLP_HOME__/shared/supervisor/supervisor_notebook.md`
(or the workspace's designated tracker with a notebook cross-reference):

```text
LEAD REPLACEMENT RECEIPT
Human mandate:
Old Lead revoked at / checkpoint:
Unresolved agents / state:
New Lead activated at / reconciliation:
Writes re-enabled at:
```

## Smells

- Packet as long as a transcript → stable state was never distilled.
- Successor re-deciding closed choices → packet omitted who closed them.
- Successor retrying dead ends → `Known failed approaches` was empty.
- Two seats `working` on one scope → break-before-make was skipped.
