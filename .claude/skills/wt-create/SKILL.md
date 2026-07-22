---
name: wt-create
description: Create a new git worktree for this repo. Use whenever the user asks to create, add, or set up a new worktree, or whenever you notice the user is starting work on a new, unrelated feature/task while the current session is already on a branch for something else — in that second case, offer a worktree rather than assuming.
model: haiku
---

# Create Worktree

Create a new git worktree for the current repository.

## Rules

- Always create new worktrees only inside `<repo_root>/.worktrees/` — never anywhere else (not as a sibling directory, not under `.claude/worktrees/`, not in a tmp directory).
- If you weren't explicitly asked to create a worktree — you noticed on your own that the user is pivoting to a new, unrelated feature/task while the current branch/worktree is mid-work on something else — don't create one unprompted. Ask first, e.g. "Do you want to work on this in a new worktree?" via `AskUserQuestion`, and only proceed with the steps below if they say yes. Skip this check when the user's request already implies a new worktree (e.g. "start a worktree for X").

## Steps

1. Determine `<repo_root>` via `git rev-parse --show-toplevel`.
2. Pick the branch name by following the `branch-name` skill (it owns the prefix convention), unless the user provides an exact branch name.
3. Run:
   ```
   git worktree add <repo_root>/.worktrees/<branch-name> -b <branch-name>
   ```
   If the branch already exists, omit `-b`:
   ```
   git worktree add <repo_root>/.worktrees/<branch-name> <branch-name>
   ```
4. Confirm the worktree was created with `git worktree list`.
