# Learning Documents

Learning notes capture non-obvious design decisions, tradeoffs, and root causes
so the Human and future sessions do not reverse-engineer diffs or repeat mistakes.

## When to write one

| Task class | Requirement |
| --- | --- |
| **Tiny**, **review / research-only**, or **straightforward `standard` fix** | **Skip** unless Supervisor explicitly requests one. Avoid boilerplate notes with no real tradeoff. |
| **`Standard` with non-obvious tradeoffs / tricky root cause** | **Required.** One crisp note using the 5 headings below. |
| **`High-risk` / Architecture lock-in** | **Required.** Thorough tradeoffs, boundaries, and reversal risks; also update `Active architecture decisions & invariants` in `workspace-protocol.md` when foundational choices change. |

Path: `docs/learning-notes/<YYYY-MM-DD>-<short-task-name>.md` (local completion
date + unique slug; Lead reserves the path in the brief so parallel worktrees
never collide).

## Writing rules

- Write in the Human's language; keep code identifiers, file paths, and technical terms in English where natural.
- Ground every claim in real files, symbols, and executed verification output. Separate verified facts from hypotheses; state `unknown` rather than guessing.
- Compare 1–2 realistic alternatives when a real design choice existed (label retrospective comparisons explicitly).
- Never add instrumentation/code solely to illustrate the note, never include secrets or raw transcripts, and never treat a note as replacement for real verification evidence.

## Structure (5 headings in order)

```markdown
# Task & What Changed
# Root Problem & Why This Approach
# Production Shape & Tradeoffs
# Verification Evidence
# Key Takeaways & Pitfalls
```

## Ownership

- **Peer:** Write only when Lead's brief requests it and reserves a path; return the exact path in handback.
- **Lead:** Reserve the path when warranted, verify the note matches accepted code, and include it in upward handback.
- **Supervisor:** Link accepted notes in the Human report with 2–3 concrete takeaways; keep separate from `__SLP_HOME__/shared/supervisor/supervisor_notebook.md`.
