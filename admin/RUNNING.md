# Running the admin app

The admin app is just an HTTP client with a UI: it never talks to a database
directly. Everything it does goes through the main app's `/api/admin/*`
endpoints, authenticated with a shared `API_KEY`. That means "run against
local" vs "run against prod" is entirely a matter of which `TARGET_URL` /
`API_KEY` pair it's pointed at — the admin app itself always runs on your own
machine, never deployed. `run-admin` and `run-admin-prod` (from the Nix dev
shell) point at `admin/.env.development.local` and
`admin/.env.production.local` respectively, so both configs can sit side by
side without swapping a single file back and forth.

```
admin/.env.development.local  --TARGET_URL + API_KEY-->  main app's /api/admin/* endpoints (local)
admin/.env.production.local   --TARGET_URL + API_KEY-->  main app's /api/admin/* endpoints (prod)
```

⚠️ **The danger zone is real in both modes.** "Reset all RSVP data" calls the
same endpoint regardless of which app you're pointed at. If `TARGET_URL` is
the prod URL, typing the confirmation phrase wipes real RSVPs. Double-check
the URL in the page header (it's printed under "Guest List") before using it.

## Testing locally

This points the admin app at your local dev copy of the main app and its
local Postgres, so nothing you do can touch real data.

1. Start the main app's local database and the app itself, from the repo
   root (inside the Nix dev shell — `nix develop`):

   ```bash
   cp .env.example .env.development.local   # if you haven't already; fill in a local API_KEY
   run
   ```

   `run` starts the Nix-managed local Postgres (`db`), then `pnpm install`
   and `pnpm dev`. The main app should now be serving on
   `http://localhost:3000`.

2. In a second terminal, configure and run the admin app:

   ```bash
   cp admin/.env.example admin/.env.development.local
   ```

   Edit `admin/.env.development.local`:

   ```
   API_KEY="<same value as the main app's .env.development.local API_KEY>"
   TARGET_URL="http://localhost:3000"
   PORT="4100"
   ```

   ```bash
   run-admin
   ```

   `run-admin` sources `admin/.env.development.local` and runs `go run .`
   for you — the admin binary itself only reads plain environment
   variables, so a bare `go run .` without sourcing that file first fails
   with "API_KEY is required".

3. Open `http://localhost:4100`. The page header shows the `TARGET_URL`
   you're pointed at — confirm it says `localhost:3000`.

Useful while iterating on `admin/`:

- `go test ./...` — run tests
- `go vet ./...` — static analysis
- `gofmt -l .` / `gofmt -w .` — check / fix formatting
- `go build ./...` — build

## Targeting prod

Same admin app, just pointed at the live site instead of localhost. You
still run it on your own machine — the admin app is never deployed to the
NAS.

1. Edit `admin/.env.production.local` (copy `admin/.env.example` first if it
   doesn't exist yet):

   ```
   API_KEY="<the API_KEY from the NAS's .env, i.e. the prod one>"
   TARGET_URL="https://<your prod HOST_URL>"
   PORT="4100"
   ```

   The prod `API_KEY` lives in the `.env` file on the NAS (see the root
   `README.md`'s Deployment section) — it's not committed anywhere. Copy it
   over (e.g. `ssh` in and read it, or keep a copy in your password manager),
   it is **not** the same value as your local `.env.development.local`'s
   `API_KEY`.

2. Run it (from the Nix dev shell):

   ```bash
   run-admin-prod
   ```

3. Open `http://localhost:4100` and confirm the header shows your real prod
   URL before making any changes — especially before using the danger zone.

Because dev and prod configs live in separate files
(`admin/.env.development.local` vs. `admin/.env.production.local`), there's
nothing to swap back — `run-admin` and `run-admin-prod` can each be run
whenever you need them, even both at once on different `PORT`s.
