# Formal Verification (Opt-in Lean 4 Playbook)

> Read by the Lead on demand when a `high-risk` / `architecture lock-in` task
> enables formal verification (for example, in the repo's approved
> `workspace-protocol.md`). Do **not** preload this guide on `tiny` or ordinary
> `standard` tasks. Peers do not read this file directly; Lead excerpts exact
> build and proof acceptance requirements into Peer briefs.

## Verification Ladder

Formal proofs complement — never replace — real execution tests:

1. **Unit & integration tests (all task classes):** Verify concrete behavior and
   real I/O boundaries (filesystem, network, database, APIs, serialization).
2. **Property-based / fuzz tests (`standard` & `high-risk`):** Exercise wide
   randomized input spaces (`fast-check`, `Hypothesis`, `proptest`, etc.) to
   catch corner cases at low cost.
3. **Lean 4 formal proofs + differential testing (`high-risk` cores only):**
   Prove universal invariants ($\forall x$) over critical state spaces and bind
   the proven model to production code.

## When to Activate vs. Skip

**Activate Lean 4 only when:**
- A defect in the core logic is costly or irreversible: state machines,
  authorization/delegation graphs, balance/ledger conservation, lock/lease
  ownership (e.g., break-before-make), consensus/scheduling rules, or
  parser/codec round-trip invariants (`decode (encode x) = x`).
- The core specification is stable enough to freeze before implementation.

**Skip Lean 4 when:**
- Work is UI, CRUD, glue scripts, third-party SDK wiring, or rapidly shifting
  product requirements. Applying theorem proving here is **ceremony capture**.

## Spec / Proof Separation (Anti-Reward-Hacking)

Never let the proof writer edit the theorem statement:

1. **Human + Lead own `Spec.lean`:** Define the core types, state transitions,
   and target `theorem` signatures (initially `sorry`). Keep `Spec.lean` short
   and auditable by eye.
2. **Lock `Spec.lean` before delegating:** Pass `SLP_LOCKED_FILES=Spec.lean`
   (or exact paths such as `formal/Spec.lean,tests/contract.test.ts`) to the
   Peer environment so `slp-guard.mjs` hard-blocks edits, and still check
   `git diff` on `Spec.lean` at acceptance.
3. **Peer owns `Proof.lean` / `Impl.lean`:** Peer iterates against `lake build`
   until the Lean kernel accepts every theorem cleanly.

## Mandatory Acceptance Gate

Lead accepts a formal handback only when **all 5 checks pass on the kept state**:

1. **Clean kernel build:** `lake build` exits `0` with no errors.
2. **Zero placeholders:** No `sorry`, `admit`, or unchecked `axiom` declarations
   in any proof module.
3. **Axiom audit:** `#print axioms <theorem>` reports only standard Lean axioms
   (`propext`, `Classical.choice`, `Quot.sound`). Reject custom axioms or
   `Lean.ofReduceBool` / `Lean.trustCompiler` unless explicitly approved in the
   workspace protocol.
4. **Non-vacuity witness:** Include at least one concrete `example` or `#eval`
   demonstrating that preconditions are satisfiable (prevents `False -> P`
   vacuous proofs).
5. **Immutable spec:** `git diff` confirms locked `Spec.lean` (and any locked
   contract tests) were not weakened or altered.

## Closing the Model-Reality Gap

A proven Lean model does not by itself prove a TypeScript, Python, Go, or Rust
implementation matches it. Close the gap with one of:

- **Differential testing (default):** Compile the executable Lean model to a
  native binary and fuzz-compare `production_impl(x) == lean_oracle(x)` over
  thousands of generated inputs.
- **Direct core execution:** Compile the verified Lean 4 core directly as a
  native binary/library called at the boundary.
- **Verified table / code generation:** Generate decision tables or state
  transitions from the verified Lean artifact and test the generated output.

## Tactic Budget & Cut-Loss Discipline

- If a Peer stalls on a single lemma for more than 3–4 tactic cycles, do not
  burn context past ~45% repeating similar scripts.
- Ask the Peer to decompose the lemma into smaller helper lemmas, or rotate to
  an alternate approved Peer model (`gemini-4-neon` <-> `gemini-4-hydrogen` at
  `xhigh`) with a clean handoff packet containing the exact goal state and
  failed approaches.
