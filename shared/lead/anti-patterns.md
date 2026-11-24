# Anti-patterns — shared vocabulary

Each name is a one-line diagnostic command Lead/Supervisor can invoke directly
(e.g., "check this plan for balloon pattern or mechanism-free claim").

| Name | Description | Handling |
| --- | --- | --- |
| **Balloon pattern** | Foundation is wrong but balloons (locks/cache/retry/heuristics) keep the feature afloat | Stop the feature, assess the foundation, fix underneath |
| **Brake pattern** | System lacks brakes (boundaries/validation/rollback/evidence) yet keeps getting upgraded | Install the brakes before accelerating |
| **Mechanism-free claim** | Names an outcome ("idempotent", "durable", "reconciled", "isolated") without the causal state/mechanism that guarantees it | Require the concrete mechanism/invariant; narrow or delete the claim if absent |
| **Local-excellence trap** | Modules and unit tests are green, yet the macro design solves the wrong problem or adds avoidable tax | Check system fit; endorse the boring standard route when it suffices (never invent defects when custom work is justified) |
| **Pre-solve** | Lead concludes first, then asks; agents are reduced to confirmation | Assign open questions before Lead locks a mental model |
| **Polling waste** | Asking "done yet?" with no signal | Event-driven wakeup, bounded watchdog only on long/unattended lanes |
| **Dual ownership** | Two agents hold edit rights over one scope | One writer per scope; separate worktrees; explicit handovers |
| **Priority-by-label** | Ordering work purely by P0/P1/P2, ignoring dependency/leverage | Sequence by dependency, foundation, and absorption |
| **Dissent-theater** | A reviewer manufactures disagreement or finding counts to look valuable | Endorse the incumbent when it remains strongest |
| **Frozen-wait mismatch** | Lead waits for `idle`, worker reports `done` | Unified state contract; done = collect results |
| **Protocol leak** | Peers learn orchestration mechanics and try self-coordinating | Keep coordination docs in `shared/supervisor/` and `shared/lead/` only; Peer `paseoTools` disabled |
| **Ceremony capture** | Extra review rounds, protocols, or reports outweigh real evidence | Smallest useful topology; escalate ceremony only when risk warrants it |
| **Forked independence** | A reviewer forked from Lead inherits its framing and bias | Fresh session, neutral brief, frozen candidate — never a fork |
| **Over-compression** | Core rules or facts compressed into lossy summaries | Keep exact rules, invariants, and evidence as text |
| **Research theater** | Spawning a subagent or Peer for something one ripgrep answers | Search directly first; spawn `research` only for genuinely broad terrain |
| **Stale-listener debt** | Old agents or heartbeats keep firing after closeout or config update | Delete heartbeats at closeout; archive old seats on updates |
| **Plan-file litter** | Completed plan files left in repo pollute future searches | Keep only active plans; delete completed plans after merge/push |
