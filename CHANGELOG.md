# Changelog

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
