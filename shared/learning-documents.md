# Learning Documents

After every implementation task, create one learning note in the project or
worktree where the implementation belongs:

`docs/learning-notes/<YYYY-MM-DD>-<short-task-name>.md`

Use the completion date in Asia/Ho_Chi_Minh and a short, unique task slug.
Do not overwrite another task's note. Lead assigns one writer and reserves the
note's path in the implementation scope, including for parallel worktrees.
The note is an implementation deliverable, not an extra review assignment.
Review-only, research-only, and ordinary monitoring tasks do not create one.

## Writing method

- Write the explanations in Vietnamese for the Human to learn from; preserve
  identifiers, technical terms, and the headings below where useful.
- Explain the actual implementation in plain language, proportionate to the
  task. Connect concepts to concrete files, symbols, and behavior instead of
  producing a generic tutorial or repeating the diff.
- Separate verified facts from hypotheses. If the real cause remains unknown,
  say so; do not invent a diagnosis, an alternative considered, or a test result.
- For non-trivial work, include at least two alternatives to the selected
  solution, explain when each makes sense, and why it was not selected here.
  Label retrospective alternatives as retrospective, not decisions actually
  evaluated during implementation. Keep trivial-task comparisons brief.
- Describe the production shape: where behavior and state live, ownership,
  boundaries, and the relevant input/output or lifecycle flow. Mention actual
  tradeoffs and limits; do not add production seams or instrumentation merely
  to illustrate the note.
- Keep the small example minimal and relevant. Clearly label illustrative or
  unexecuted examples; they are not evidence that production behavior works.
  Include real checks and their results under What I changed, with links to
  evidence when available. A learning note never replaces acceptance evidence.
- Do not include secrets, credentials, customer data, or raw transcript dumps.

## Required structure

Use all of these headings, in this order:

```markdown
# Task

# What I changed

# The real problem

# Why this solution

# Production shape

# Other possible approaches

# Why I did not choose those alternatives

# Key concepts to learn

# Common mistakes

# Small example

# How to think about this next time
```

## Role responsibilities and reporting

- Peer: write the note for the implementation task you own and include its
  exact path in the durable handback. Do not edit another owner's note or
  create additional project work outside your assignment. If the path is
  unavailable or conflicts with workspace rules, ask Lead to resolve it.
- Lead: include the note and its reserved path in implementation briefs;
  check that it accurately describes the accepted state. Integrate it with
  its implementation, carry accepted paths in the handback to Supervisor, and
  write a note for any distinct implementation/integration task you own.
  Do not duplicate a Peer's note just to produce a lane-level report.
- Supervisor: include the learning-note requirement when briefing Lead. In
  the Human-facing completion report, link the accepted notes and summarize
  a few concrete takeaways in Vietnamese. Do not silently write technical
  claims on behalf of Lead or rerun implementation validation to make a note.
- Keep these project learning notes separate from the Supervisor's append-only
  operational memory at `__SLP_HOME__/shared/supervisor_notebook.md`.

This requirement does not authorize pushes, deployments, spending, changes to
shared documents, or expanding the implementation scope. Surface conflicts
with an approved workspace protocol before proceeding with the affected work.
