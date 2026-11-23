# Learning Documents

Vietnamese learning notes help the Human understand non-trivial implementation
changes and technical tradeoffs without wading through raw diffs or transcripts.

## When to write one

| Task class | Requirement |
| --- | --- |
| **Tiny** (1–2 files, low-risk fix) or **review / research-only** | **Skip.** Do not create a learning note unless the Supervisor explicitly asks. |
| **Standard** (multi-file feature or bugfix) | **Required.** One concise note per implementation task (5 headings below). |
| **High-risk / Architecture lock-in** | **Required.** One thorough note covering architecture tradeoffs, boundaries, and reversal risks. |

Path inside the project or worktree:

`docs/learning-notes/<YYYY-MM-DD>-<short-task-name>.md`

Use the completion date in `Asia/Ho_Chi_Minh` and a short unique slug. Lead
assigns one writer and reserves the path in the brief so parallel worktrees
never collide.

## Writing method

- Write in clear Vietnamese for the Human; keep code identifiers, file paths,
  and technical terms in English where natural.
- Ground every claim in concrete files, symbols, and real verification output.
  Separate verified facts from hypotheses; if a root cause is still unknown,
  say so instead of guessing.
- For `standard` and `high-risk` work, briefly compare at least 1–2 realistic
  alternatives and why they were not chosen (label retrospective comparisons
  explicitly).
- Do not add production code/instrumentation just to illustrate the note, and
  never include secrets, credentials, customer data, or raw transcript dumps.
- A learning note never replaces real acceptance evidence.

## Structure

Use these 5 headings in order (proportional to task complexity — keep `standard`
notes crisp; expand tradeoffs and diagrams only for `high-risk` tasks):

```markdown
# Task & What Changed

# Root Problem & Why This Approach

# Production Shape & Tradeoffs

# Verification Evidence

# Key Takeaways & Pitfalls
```

## Role responsibilities

- **Peer:** Write the note only when Lead's brief requests it and reserves a
  path. Include the exact path in your handback message.
- **Lead:** Reserve the path in `standard` / `high-risk` implementation briefs,
  verify the note matches the accepted state, and include its path in the
  handback to Supervisor. Write a note for your own distinct integration work
  without duplicating a Peer's note.
- **Supervisor:** Link accepted notes in the completion report to the Human and
  highlight 2–3 concrete takeaways in Vietnamese. Keep project learning notes
  separate from `__SLP_HOME__/shared/supervisor/supervisor_notebook.md`.
