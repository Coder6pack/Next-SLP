# Test Proof Debt Audit

Audit only the named behavioral claim and its cited proof. Do not turn ordinary
implementation, failing tests, or normal mock boundaries into a repo-wide audit.

1. Name the claimed production behavior.
2. Identify the cited proof (test, validator, benchmark, or gate).
3. State what the proof actually observes: executed behavior, machine-readable contract, or proxy text/metadata.
4. Apply deletion sensitivity: would the check still pass if the claimed production behavior disappeared?
5. Verify expected values come from independent truth (not copied from the same output/algorithm).
6. Choose: `keep`, `replace`, `demote`, `closeout-only`, `delete`, or `escalate`.

## Hard rules

- **No history-only proof debt:** A current test must not pin retired tags, versions, widths, or forbidden strings merely to prove their absence; test current contract boundaries instead.
- **No proxy laundering:** Source scans, prose checks, fixture existence, or mocks prove only their own boundary — never runtime production behavior.
- **Report concisely:** Location, claimed behavior, actual observation, disconfirming scenario, and smallest replacement. Weak proof does not justify an architecture redesign.
