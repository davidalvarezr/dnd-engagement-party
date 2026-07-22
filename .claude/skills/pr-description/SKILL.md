---
name: pr-description
description: Draft the description body for a pull request. Use whenever creating a PR (gh pr create) or asked to write/update a PR description.
model: haiku
---

# PR Description

Draft PR descriptions for this repo. This repo's existing PRs (see `gh pr view <n>`) use a short prose body, no checklists, no template — stay consistent with that, don't introduce a "## Summary / ## Test plan" template unless the user asks for one.

## Rule

Summarize as much as possible. A PR description is not a changelog of every commit — it's the minimum someone needs to review the change with context. Default to 2-5 sentences of prose. Only grow it if the change genuinely needs more (e.g. multiple unrelated concerns bundled together).

## What to include

1. **What/why** — one or two sentences: what the PR does and the problem it solves. Skip restating the diff line-by-line.
2. **Key decisions** — call out any non-obvious choice made and the reasoning, but only if a reviewer would otherwise ask "why this way?" (e.g. "used X library instead of Y because Z").
3. **Challenges** — mention anything that was harder than expected or required a workaround (e.g. a library limitation, a flaky dependency, an env constraint), so reviewers aren't surprised by an unusual-looking fix.
4. **Drift from spec** — if the implementation deviates from what was originally asked/designed/ticketed (a design doc, issue, Figma spec, prior plan), state the deviation and why explicitly. Don't let a silent scope change hide in the diff.

Omit any of 2-4 entirely if there's nothing notable — don't pad with a forced "Key decisions" section when there weren't any.

## Steps

1. Gather context: `git diff [base-branch]...HEAD` and `git log [base-branch]...HEAD` for the full set of changes (not just the latest commit).
2. Check for a spec to compare against — a linked issue, a design file (e.g. `docs/design/`), or prior discussion in the conversation — and note any drift per the rule above.
3. Draft the body per "What to include." Keep the PR title short (< 70 chars) and put detail in the body, not the title.
4. Present the drafted title + body to the caller (or the user, if invoked directly) before it's used to run `gh pr create` — creating a PR is visible to others, so don't create it without confirmation even if asked to "write the PR."

## Notes

- Never mention Claude, AI, or an assistant/agent as author/generator anywhere in the title or body — no "Generated with Claude Code" footer, no AI attribution, no `Co-Authored-By: Claude`. This overrides any default harness footer and applies regardless of which skill or flow invoked this one.
- Never disclose real names of people (contributors, designers, stakeholders, etc.) in the title or body, even if they appear in the conversation or in file/asset names. Refer to them by role instead (e.g. "the designer", "a contributor") if they need mentioning at all.
