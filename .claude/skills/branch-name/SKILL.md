---
name: branch-name
description: Determine a conventional branch name and, if asked for a plain branch, create it. Use whenever a branch name needs to be picked — for creating a new branch directly, or for naming a new worktree (see the wt-create skill).
model: haiku
---

# Branch Name

Single source of truth for this repo's branch naming convention. Other skills (e.g. `wt-create`) should defer here instead of duplicating the prefix table.

## Naming conventions

| Prefix | Use for | Example |
|---|---|---|
| `feature/` (or `feat/`) | New features | `feature/add-login-page`, `feat/add-login-page` |
| `bugfix/` (or `fix/`) | Bug fixes | `bugfix/fix-header-bug`, `fix/header-bug` |
| `hotfix/` | Urgent fixes | `hotfix/security-patch` |
| `release/` | Release prep | `release/v1.2.0` |
| `chore/` | Non-code tasks (deps, docs) | `chore/update-dependencies` |

## Determining the name

1. Infer the branch type from what's being described (new feature, bug fix, urgent fix, release prep, or chore) and pick the matching prefix. If it's ambiguous, ask.
2. Build the name as `<prefix>/<kebab-case-description>`.
3. If the user provided an exact branch name, use that instead of inferring one.

## If this was invoked to create a plain branch

4. Determine the base ref: use the current branch's default (e.g. `main`) unless the user specifies otherwise.
5. Create and switch to the branch:
   ```
   git checkout -b <prefix>/<description> <base-ref>
   ```
6. Confirm with `git branch --show-current`.

## If this was invoked to name a worktree

Just return the `<prefix>/<description>` name — let the `wt-create` skill handle the `git worktree add` step.

## Notes

- Do not push the new branch unless the user explicitly asks.
