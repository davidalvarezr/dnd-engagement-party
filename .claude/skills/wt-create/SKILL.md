---
name: wt-create
description: Create a new git worktree for this repo. Use whenever the user asks to create, add, or set up a new worktree.
model: haiku
---

# Create Worktree

Create a new git worktree for the current repository.

## Rule

Always create new worktrees only inside `<repo_root>/.worktrees/` — never anywhere else (not as a sibling directory, not under `.claude/worktrees/`, not in a tmp directory).

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
