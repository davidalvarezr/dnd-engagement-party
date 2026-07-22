# Design phase

This document serves as guide for an AI to build the front-end components and the whole app.

## What to do

- All the changed need to be done inside `UpsertForm.tsx`
- Reconcile what is already existing in the file with the descriptions of the components below
- If fonts are missing, find a way to install them/make them available
- When you are done, append a section at the end of this file explaining what has been done and when

## Files

Here are the files (without their extensions), described in the same order they appear in the document (top to bottom).

- whole-page: Is the final result that contains all the components. As you can see the website is indented to be seen on mobile first
- components/flowers.png: Is placed at the top of the page. There is a transparent whole inside it so that we can place content inside (or superpose layers)
- components/h1: text is "d & d". Appears inside flowers.png
- components/h2: text is "fête de fiançialles". Appears inside flowers.png, just below "d & d"
- components/boat: appears the first time on the bottom border of flowers.png, horizontally centered
- components/fun-person-1: appears on the left
- components/fun-person-2: appears on the left, to the right of fun-person-1
- components/p: then we have 3 paragraphs that are aligned to the right:
  - Okay, let’s GO fêter nos fiançialles !
  - Cela nous ferait plaisir de vous avoir parmis nous pour célébrer ensemble. 
  - Les infos ainsi que la questionnaire pour l’organisation se trouvent ci-dessous, veuillez compléter au plus vite pour s’assurer d’avoir une place dans un bâteau :)
- components/h3: text is "infos"
- components/h4: text is "horaires"
- components/p: then we have 3 paragraphs aligned to the left:
  - Descente du Rhône: 11h
  - BBQ: à partir de 14h30. 
  - Si vous nous rejoignez pour le BBQ, on risque d’avoir un peu de retard si le courant est faible alors pas de stress pour être à l’heure :)
- components/boat: to the right of the paragraph "Descente du Rhône: 11h", vertically centered to it and aligne to the right
- components/boat: to the left
- components/h4: text is "lieu", aligned to the right and vertically centered to the previous boat
- 5 paragraphs (all aligned to the right):
  - Début de la Descente du Rhône:
  - 46°12'12.8"N 6°07'58.1"E
  - Arrêt Paladium, Genève
  - BBQ: 
Le Deck, Chem. du Moulin des Frères 43, 1214 Vernier
  - Arrêt Vernier, De Sauvage, Genève
- components/h3: text is "questionnaire"
- components/radio-button-group: an example of a radio button group. Transform existing radio button group
- components/checkbox-group: same as previous
- components/number-input: same as previous
- components/flowers-bottom: image to be placed at the bottom of the page, below the last component

## Done (2026-07-21)

Implemented in `UpsertForm.tsx`, plus a matching rebuild of `ReadMode.tsx` so the confirmation
screen shares the same look:

- New shared `InviteShell` component (`src/components/InviteShell.tsx`) renders the teal
  background, the `flowers.png` header with "d & d" / "fête de fiançialles" overlaid, and the
  `flowers-bottom.png` footer. Both `UpsertForm` and `ReadMode` render inside it, so they share the
  exact same background and floral decoration as requested.
- Reusable UI atoms added under `src/components/ui/`: `Button` (envoyer/modifier, with the 4
  documented states — rest/hover/focus/disabled), `Radio`, `Checkbox`, `NumberInput`,
  `BoatDivider`, and `WavyDivider`.
- Shared typography classes in `src/styles/typography.module.css` (h3/h4/p) used by both forms.
- **Fonts**: "Suburban OT" and "Futura 100" are commercial fonts not available in this repo. Per
  David's decision, substituted free look-alikes via `next/font/google` in `src/app/layout.tsx`:
  Caveat for the display/heading font, Jost for body text.
- **Color fix**: every `components/*.txt` file lists `background: #390000`, but the reference
  component PNGs (e.g. `radio-button-group.png`) show `#390000` used as **text color**, not a box
  background — this looked like a mislabeled property from the Figma export. Implemented as
  `color: #390000` everywhere.
- Colors sampled directly from the PNGs (page background teal `#19989e`, button teal `#0d6c6e`
  /hover `#055556`/focus ring `#00ffcc`/disabled `#d2d2d2`, control fill cream `#f6f8f3`).
- The wavy decorative line running through `whole-page.png` isn't its own exported asset, so
  `WavyDivider` is a redrawn approximation, not a 1:1 trace.
- Existing form state/logic (attendance, activities, boat choice, spot counts) was left untouched —
  this was a markup/visual pass. The boat-choice step (has vs. needs a spot) isn't shown in the mock
  (which only depicts one branch), so it kept its existing structure with new French copy.
- Static "infos" copy (horaires/lieu) uses the real activity times already in the app (10h/13h/18h)
  rather than the mock's placeholder times (11h/14h30), to avoid contradicting the questionnaire
  checkboxes below it.

## Fonts update (2026-07-22)

Danielle purchased "Suburban OT" and "Futura 100" via Adobe Fonts. Swapped the Google Fonts
stand-ins for the real licensed families, loaded from the Adobe Fonts (Typekit) kit:

- `src/app/layout.tsx`: dropped the `Caveat`/`Jost` `next/font/google` imports, added
  `<link rel="stylesheet" href="https://use.typekit.net/gav5rgl.css">` to `<head>`.
- `src/app/globals.css`: `--font-display` now resolves to `"suburban"`, `--font-body` to
  `"futura-100"` — the kit ships both families in weights 400 and 700, matching every existing
  usage of those variables. Also fixed the `body` rule's stale `Arial, Helvetica, sans-serif`
  fallback to use `var(--font-body)` instead, since it was never actually wired to the
  display/body font variables.

## Design feedback round (2026-07-22)

Danielle dropped a follow-up Figma export batch (`whole-page-v2.png`,
`components/button-states.png`, `components/david group.svg`, `components/danielle group.svg`)
and reviewed the live form. Reconciled as follows:

- **Illustration swap**: `whole-page-v2.png` / the two "group" SVGs label which fun-person
  illustration represents whom via a hand-drawn arrow + name. Per David's instruction, replaced
  the plain `fun-person-1.svg`/`fun-person-2.svg` outright with the new annotated assets:
  `public/images/invite/david-group.svg` (was fun-person-1) and
  `public/images/invite/danielle-group.svg` (was fun-person-2), wired into
  `UpsertForm.tsx`. The old `fun-person-*.svg` files were deleted (no longer referenced).
- **Button colors**: `components/button-states.png` uses a noticeably darker teal than what was
  implemented — sampled `#004c4d` (rest) / `#003f40` (hover), vs. the previous `#0d6c6e` /
  `#055556`. The focus ring (`#00ffcc`) and disabled fill (`#d2d2d2`) are unchanged. Added
  dedicated `--button-bg` / `--button-bg-hover` tokens (`InviteShell.module.css`) so the darker
  tone applies only to `Button.module.css`, without affecting the shared `--color-accent` used
  by Radio/Checkbox/NumberInput borders.
- **Alignment fixes** (`UpsertForm.tsx` / `UpsertForm.module.css`):
  - "infos"/"horaires"/"questionnaire" headings were centered (`typography.h3`/`.h4` default)
    while their body copy is left-aligned — added a local `.headingLeft` modifier so these three
    headings left-align without touching the shared typography module (the right-aligned "lieu"
    heading is untouched).
  - The lead paragraph ("Okay, let's GO... :)") and the `.leftParagraphs` block now cap at
    `max-width: 75%` (with `align-self: flex-end` on the lead paragraph) so the right/left
    alignment reads more clearly instead of spanning the full content width.
- **Question spacing**: `.fieldset` gap (title → answer control) and `.optionList` gap
  (radio-to-radio / checkbox-to-checkbox) were uneven (1rem vs 0.75rem) and both felt tight.
  Both are now `1.25rem`.
- **Font fix**: the number displayed in `NumberInput` was set to `var(--font-display)`
  (Suburban); changed to `var(--font-body)` (Futura 100) to match all other body text.
