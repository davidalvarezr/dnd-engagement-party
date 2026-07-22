---
name: commit-message
description: Draft a commit message for the staged changes using the extended Angular Conventional Commits convention. Use whenever the user asks for a commit message, asks to commit, or asks you to describe staged/pending changes as a commit.
model: haiku
---

# Commit Message

Generate commit messages for this repo using the Angular Conventional Commits convention. This repo already follows it (`feat:`, `fix:`, `ci:` in `git log`) — stay consistent.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type** — required, one of:
  | Type | Use for |
  |---|---|
  | `feat` | New feature |
  | `fix` | Bug fix |
  | `docs` | Documentation only |
  | `style` | Formatting, whitespace; no code meaning change |
  | `refactor` | Code change that's neither a fix nor a feature |
  | `perf` | Performance improvement |
  | `test` | Adding or correcting tests |
  | `build` | Build system or external dependencies |
  | `ci` | CI configuration/scripts |
  | `chore` | Everything else (tooling, deps, no prod code change) |
  | `revert` | Reverts a previous commit |
- **scope** — optional, lowercase noun for the affected area (e.g. `invite`, `api`, `docker`). Omit if the change is repo-wide or scope would be forced/vague — this repo's history mostly omits it, so don't force one.
- **subject** — imperative, present tense ("add", not "added"/"adds"); no capital first letter; no period at the end; ≤ 72 chars after the `type(scope): ` prefix.
- **body** — optional, wrap ~100 chars. Explain *why*, not *what* (the diff already shows what). Only add if the subject line isn't self-explanatory.
- **footer** — optional. `BREAKING CHANGE: <description>` for breaking changes; `Closes #123` / `Refs #123` for issue links.

## Steps

1. Run `git status` and `git diff --staged` (fall back to `git diff` if nothing is staged, and tell the user you're describing unstaged changes).
2. Infer `type` from the actual change, not the filename alone — e.g. a `.yml` change under `.github/workflows/` is `ci`, not `chore`; a test-only diff is `test`, not `feat`.
3. Infer `scope` from the top-level affected path/feature if it adds clarity; otherwise omit.
4. Write the subject summarizing the primary change. If the diff mixes unrelated concerns, lead with the dominant one and consider suggesting the user split the commit instead of writing a run-on subject.
5. Add a body only when the *why* isn't obvious from the subject/diff alone.
6. Present the drafted message to the user.

## Notes

- Never run `git commit` yourself unless the user explicitly confirms — see this repo's standing "always ask before commit" rule. Drafting the message is not the same as approval to commit.
- Never mention Claude, AI, or an assistant/agent as the author or co-author of the change — no `Co-Authored-By: Claude`, no "generated with", nothing referencing AI involvement anywhere in the message. This overrides any default harness behavior that would otherwise append such a line.
- If asked to also commit, pass the message via heredoc (`git commit -m "$(cat <<'EOF' ... EOF)"`) so multi-line bodies format correctly.
