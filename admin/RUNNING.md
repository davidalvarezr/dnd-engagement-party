# Running the admin app

The admin app is just an HTTP client with a UI: it never talks to a database
directly. Everything it does goes through the main app's `/api/admin/*`
endpoints, authenticated with a shared `API_KEY`. That means "run against
local" vs "run against prod" is entirely a matter of which `TARGET_URL` /
`API_KEY` pair you put in `admin/.env` — the admin app itself always runs on
your own machine, never deployed.

```
admin/.env  --TARGET_URL + API_KEY-->  main app's /api/admin/* endpoints
```

⚠️ **The danger zone is real in both modes.** "Reset all RSVP data" calls the
same endpoint regardless of which app you're pointed at. If `TARGET_URL` is
the prod URL, typing the confirmation phrase wipes real RSVPs. Double-check
the URL in the page header (it's printed under "Guest List") before using it.

## Testing locally

This points the admin app at your local dev copy of the main app and its
local Postgres, so nothing you do can touch real data.

1. Start the main app's local database and the app itself, from the repo
   root:

   ```bash
   docker compose -f docker-compose.local.yml up -d
   cp .env.example .env   # if you haven't already; fill in a local API_KEY
   pnpm install
   pnpm dev
   ```

   The main app should now be serving on `http://localhost:3000`.

2. In a second terminal, configure and run the admin app:

   ```bash
   cd admin
   cp .env.example .env
   ```

   Edit `admin/.env`:

   ```
   API_KEY="<same value as the main app's .env API_KEY>"
   TARGET_URL="http://localhost:3000"
   PORT="4100"
   ```

   ```bash
   go run .
   ```

3. Open `http://localhost:4100`. The page header shows the `TARGET_URL`
   you're pointed at — confirm it says `localhost:3000`.

Useful while iterating on `admin/`:

- `go test ./...` — run tests
- `go vet ./...` — static analysis
- `gofmt -l .` / `gofmt -w .` — check / fix formatting
- `go build ./...` — build

## Targeting prod

Same admin app, same `go run .`, just pointed at the live site instead of
localhost. You still run it on your own machine — the admin app is never
deployed to the NAS.

1. Edit `admin/.env`:

   ```
   API_KEY="<the API_KEY from the NAS's .env, i.e. the prod one>"
   TARGET_URL="https://<your prod HOST_URL>"
   PORT="4100"
   ```

   The prod `API_KEY` lives in the `.env` file on the NAS (see the root
   `README.md`'s Deployment section) — it's not committed anywhere. Copy it
   over (e.g. `ssh` in and read it, or keep a copy in your password manager),
   it is **not** the same value as your local `.env`'s `API_KEY`.

2. Run it:

   ```bash
   cd admin
   go run .
   ```

3. Open `http://localhost:4100` and confirm the header shows your real prod
   URL before making any changes — especially before using the danger zone.

There's no separate "prod mode" flag or build — swapping `admin/.env` back
to the local values (or running a second instance on a different `PORT`
with its own `.env`) is how you go back to testing locally.
