# Changelog

## 0.4.0 (2026-10-12)

- `/checklist close` ends a plan you no longer want tracked, even with steps left. The band goes away, the turn is no longer held for unchecked steps, and Claude is told not to carry on with the remaining ones. A resumed session or a branch does not bring the closed plan back. Before this, only `/clear` dropped a plan.

## 0.3.3 (2026-10-12)

- Claude no longer finishes a plan's work without checking the steps off. Ending a turn with steps unchecked is blocked once, with the remaining steps listed; it is blocked again only after a step is checked.
- The reminder of the remaining steps now comes with each prompt instead of sitting in the system prompt, where it did not reach Claude.

## 0.3.2 (2026-10-12)

- Only the main agent can check a step off. A subagent's `plan_check` is refused and it is told to put its evidence in its report, so the main agent verifies the work before checking it. This also keeps every check in the main transcript, which a resumed session replays.

## 0.3.1 (2026-10-12)

- The checklist comes back after a session is resumed: leaving to agent view with ← and coming back, `claude --resume`, `/resume` or `/branch`. It used to disappear because session state does not survive a resume or a branch. The plan and its checks are now replayed from the transcript.

## 0.3.0 (2026-10-10)

- `/checklist` is easier to read. Each step shows its short title (the text before the first `: `), evidence is listed one check per line, and a blank line separates steps.
- The band and the expanded list also use the short step title.
- Claude is asked to write evidence as one `command → result` per line.

## 0.2.0 (2026-10-10)

First public release.

- An approved plan becomes a checklist shown in a one-line band above the prompt, which narrows to fit tmux panes.
- Claude checks a step off through the `plan_check` tool, and only with verification evidence.
- Claude is reminded of the remaining steps every turn. The list survives `/compact` and `/clear` wipes it.
- `/checklist` lists every step with its evidence.
- English and Korean, set with the `language` option.
