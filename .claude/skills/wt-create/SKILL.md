---
name: wt-create
description: Create a new git worktree for this repo. Use whenever the user asks to create, add, or set up a new worktree, or whenever you notice the user is starting work on a new, unrelated feature/task while the current session is already on a branch for something else — in that second case, offer a worktree rather than assuming. Also triggered when the user says something like "Let's work on a new feature" or something similar.
model: haiku
allowed-tools: Bash(git fetch:*), Bash(git status:*), Bash(git rev-list:*), Bash(git pull:*), EnterWorktree, AskUserQuestion, Skill(branch-name)
---

# Create Worktree

Create a new git worktree for the current repository.

## Rules

- If you weren't explicitly asked to create a worktree — you noticed on your own that the user is pivoting to a new, unrelated feature/task while the current branch/worktree is mid-work on something else — don't create one unprompted. Ask first, e.g. "Do you want to work on this in a new worktree?" via `AskUserQuestion`, and only proceed with the steps below if they say yes. Skip this check when the user's request already implies a new worktree (e.g. "start a worktree for X").

## Steps

1. Run `git fetch` for the current branch's remote, then compare with `git rev-list --left-right --count HEAD...@{u}`. If the current branch is behind, try `git pull` (fast-forward only). If it isn't a clean fast-forward (diverged history, local uncommitted changes in the way), stop and ask the user how to proceed instead of merging/rebasing on your own.
2. Pick the branch name by following the `branch-name` skill (it owns the prefix convention), unless the user provides an exact branch name.
3. Use `EnterWorktree(<branch-name>)`. DO NOT replace `/` by `+` in the worktree name and branch name. DO NOT prefix the branch with `worktree`

Example: The user asks to work on a new feature to refactor the code.

Expected worktree: `.claude/worktrees/feature/refactor`.

Expected branch name: `feature/refactor`