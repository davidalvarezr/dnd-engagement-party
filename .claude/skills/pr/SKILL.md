---
name: pr
description: Create a pull request for the current branch. Use whenever a PR is about to be opened for this repo — whether the user explicitly asks, or you're doing it on your own initiative (e.g. wrapping up isolated worktree/background-job work). Check this skill before any `gh pr create` call, not just user-requested ones.
model: haiku
---

# PR

Create a pull request for the current branch via `gh pr create`.

## Rules

- Always create the PR as a **draft** (`gh pr create --draft`) unless the user explicitly says otherwise (e.g. "open it as ready", "not a draft", "mark ready for review").
- Always target `develop` as the base branch (`--base develop`) unless the user explicitly specifies a different target (e.g. "target main", "base it on release/1.2").

## Steps

1. Confirm the branch is pushed to the remote (push with `-u` if it isn't yet — pushing is visible to others, so confirm with the user first if it hasn't been discussed).
2. Use the `pr-description` skill to draft the title and body — don't draft it inline here, that skill owns the summarization rules (what/why, key decisions, challenges, spec drift) and the no-AI-attribution rule.
3. Present the drafted title + body, the base branch, and the draft-vs-ready choice to the user before creating.
4. Create it:
   ```
   gh pr create --draft --base develop --title "<title>" --body "$(cat <<'EOF'
   <body>
   EOF
   )"
   ```
   Omit `--draft` only if the user asked for a ready-for-review PR. Change `--base develop` only if the user specified a different target branch.
5. Return the PR URL from `gh pr create`'s output.

## Notes

- Never mention Claude, AI, or an assistant/agent as author/generator anywhere in the PR — this is enforced by the `pr-description` skill, don't reintroduce it when assembling the final `gh pr create` call.
