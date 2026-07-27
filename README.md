This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

**Prerequisites**: [Nix](https://nixos.org) (for the dev shell and Nix-managed local Postgres), [pnpm](https://pnpm.io), and Node (see `package.json` for the version this project targets). If you use [direnv](https://direnv.net), the checked-in `.envrc` auto-loads the Nix dev shell on `cd`.

```bash
nix develop
pnpm install
cp .env.example .env.development.local
pnpm db:setup
pnpm dev
```

Or just run `run` from inside the Nix dev shell, which does `db`, `pnpm install`, and `pnpm dev` in one step.

- `pnpm db:setup` starts the local Postgres cluster (Nix-managed, data in `.data/postgres` — see `flake.nix`) and applies migrations. It's a shortcut for `pnpm db:up && pnpm db:migrate`. `db-stop` stops it; `db-fg` runs it in the foreground.

**Nix dev shell commands** (also printed on `nix develop`, see `flake.nix`):

| Command | What it does |
| --- | --- |
| `db` | Start the local Postgres in the background |
| `db-fg` | Start the local Postgres in the foreground (Ctrl+C to stop, no `db-stop` needed) |
| `db-stop` | Stop the backgrounded local Postgres |
| `migrate` | Start Postgres and apply pending Prisma migrations |
| `run` | Run the main app (`pnpm dev`) |
| `run-admin` | Run the admin app (`go run`) |
| `run-admin-prod` | Run the prod admin app (`go run`) |
| `format` | Format both apps (biome + gofmt) |
| `check` | Run every check both apps run in CI |

- **Migrations create tables; they don't add guests.** Running `prisma migrate deploy` (`pnpm db:migrate`) gives you an empty `Invitation` table — every `/invite/<code>` link will 404 with "You are not invited" until you add guests via the admin app's CSV import (see `docs/invitee-list.example.csv` for the format).

Once you've imported guests, open [http://localhost:3000](http://localhost:3000) and visit an invite link, e.g. `http://localhost:3000/invite/<code>`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development

- `pnpm test` — run the test suite (Vitest)
- `pnpm format` — auto-format the codebase with Biome
- `pnpm format:check` — check formatting without writing changes (used in CI)
- `pnpm lint` — lint with Biome

From inside the Nix dev shell, `format` and `check` run the equivalent commands for **both** apps in one step — `format` runs `pnpm format` and `gofmt -w` on `admin/`; `check` runs everything CI runs (formatting, lint, tests, build) for the main app and the admin app.

**CI**: every pull request into `develop` or `main` runs `.github/workflows/ci.yml` (path-filtered to skip the main app's checks for admin-only or docs-only changes) and `.github/workflows/ci-admin.yml` (only for changes under `admin/`) — both run the same formatting/lint/test/build checks `check` runs locally. Pull requests into `main` additionally run `.github/workflows/branch-policy.yml`, which only allows `develop` or a `hotfix/*` branch as the merge source; `main` has branch protection requiring all of these checks to pass before merging. On push to `main`, `.github/workflows/release.yml` re-verifies the main app, computes the next semver tag from conventional commits, and publishes the Docker image — a push that fails verification never reaches the registry.

To run the same formatting/lint checks locally before every commit, enable the checked-in pre-commit hook once:

```bash
git config core.hooksPath .githooks
```

## Admin app

`admin/` is a small, separate Go + HTMX app for managing the guest list day to day (view invitees, add/delete people, pair couples, see RSVP stats). It runs locally only — never deployed — and talks to this app's `/api/admin/*` endpoints over HTTP, authenticated with a shared `API_KEY` (`X-Api-Key` header). Set `API_KEY` in the main app's env file (`.env.development.local` locally, `.env` in production) for the endpoints to work.

To run it, from inside the Nix dev shell:

```bash
cp admin/.env.example admin/.env.development.local
# fill in API_KEY (must match this app's API_KEY) and TARGET_URL
# (http://localhost:3000 for local dev, or your live URL)
run-admin
```

`run-admin` (runnable from anywhere in the repo) sources `admin/.env.development.local` and runs `go run .` for you — the admin binary itself only reads plain environment variables, so a bare `go run .` without sourcing that file first will fail with "API_KEY is required".

Then open `http://localhost:4100` (or whatever `PORT` you set).

See [`admin/RUNNING.md`](admin/RUNNING.md) for a fuller walkthrough of
running it against local dev vs. pointing it at prod.

Dev commands (run from `admin/`):

- `go test ./...` — run tests
- `go vet ./...` — static analysis
- `gofmt -l .` — check formatting (`gofmt -w .` to fix)
- `go build ./...` — build

The same pre-commit hook above also runs `gofmt`/`go vet` on `admin/` when files there are staged, and `.github/workflows/ci-admin.yml` runs the same checks in CI on PRs that touch `admin/`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment

This project is deployed to a self-hosted NAS via Docker, with CI building and publishing images automatically.

**CI flow**: every push to `main` triggers `.github/workflows/release.yml`, which computes the next semver tag from conventional commits, builds the Docker image, and pushes it to the GitHub Container Registry (private, scoped to this repo) as `ghcr.io/davidalvarezr/dnd-engagement-party:vX.Y.Z` and `:latest`.

**One-time NAS setup**:

```bash
git clone <repo-url>
cd dnd-engagement-party
cp .env.example .env
# fill in real values in .env
chmod 600 .env

# the image is private - authenticate the NAS's Docker daemon once so
# both this pull and Watchtower's periodic pulls succeed. Use a GitHub
# PAT (classic or fine-grained) scoped to read:packages on this repo.
echo "$GITHUB_PAT" | docker login ghcr.io -u <your-github-username> --password-stdin

docker compose up -d

# load the initial guest list via the admin app's CSV import (one-time -
# the admin app is the source of truth after this, so this does not run
# automatically on restarts/deploys)
```

**Steady state**: nothing to do. A `watchtower` service polls the registry every 5 minutes and automatically pulls + restarts the `web` container when a new `latest` image is published — no manual steps for ordinary releases. Watchtower reuses the Docker daemon's stored `ghcr.io` credentials, so no extra config is needed there.

**When `docker-compose.yml` itself changes** (new services, structural changes): Watchtower only reacts to image digest changes, not compose file edits, so you still need to run `git pull && docker compose up -d` on the NAS once to pick up the change.
