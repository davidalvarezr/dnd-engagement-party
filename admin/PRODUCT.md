# Product

## Register

product

## Platform

web

## Users

David and Danielle — the two people running the engagement party and the only users of this tool, ever. They're managing the guest list day to day: checking who's RSVP'd, fixing mistakes (wrong name, a couple that got entered as two singles), and keeping an eye on headcounts for catering and the boat trip. They run this locally on their own machine, not in front of guests, usually in short sessions to answer one specific question ("did the Martins RSVP yet?") or make one specific fix.

## Product Purpose

A local admin tool that talks to the main party site's API to manage the guest list without touching the database directly: view every invitee, add or remove people, pair two singles into a couple sharing one invite, and see RSVP stats at a glance. It exists because the main site has no admin surface and guest management currently means direct DB access. Success is: any edit takes seconds, and the two admins trust the numbers on screen enough to act on them (e.g. tell the caterer a headcount) without double-checking the database.

## Positioning

The fastest way to make a guest-list correction or check RSVP status without opening a database client.

## Brand Personality

Plain and utilitarian. It reads like a well-made internal tool, not a product marketing itself — dense information, minimal chrome, nothing decorative that doesn't help scanning or acting faster. Confidence comes from clarity (the data is legible, the actions are obvious) rather than visual flourish.

## Anti-references

Generic AI-generated SaaS dashboard: gradient stat-tile heroes, oversized rounded cards for every list item, a purple-and-white startup-template palette, decorative icons that don't carry information. Nothing here should look like it's trying to be sold.

## Design Principles

- Clarity over decoration — every visual choice should make the data faster to read or the action safer to take, or it doesn't belong.
- One page, no navigation maze — this is a single dashboard, not an app shell; don't build out IA for a tool with five actions.
- Friction scales with damage — destructive actions (delete a person, delete a couple, merge answers) get a confirmation step; everything else (viewing, expanding) is instant.
- Show the data, not a summary of the data — prefer real names and real numbers over abstracted icons or vague status pills where a number or name reads faster.

## Accessibility & Inclusion

Standard baseline: WCAG AA contrast, full keyboard operability (all actions reachable and usable without a mouse), no motion-dependent affordances. No additional accommodations needed beyond that — known, small user base.
