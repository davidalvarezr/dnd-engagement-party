This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development

- `pnpm test` — run the test suite (Vitest)
- `pnpm format` — auto-format the codebase with Biome
- `pnpm format:check` — check formatting without writing changes (used in CI)
- `pnpm lint` — lint with Biome

CI (`.github/workflows/release.yml`) runs formatting, linting, tests, and a production build before a new version is tagged and a Docker image is published — a push to `main` that fails any of these never reaches the registry.

To run the same formatting/lint checks locally before every commit, enable the checked-in pre-commit hook once:

```bash
git config core.hooksPath .githooks
```

## Admin app

`admin/` is a small, separate Go + HTMX app for managing the guest list day to day (view invitees, add/delete people, pair couples, see RSVP stats). It runs locally only — never deployed — and talks to this app's `/api/admin/*` endpoints over HTTP, authenticated with a shared `API_KEY` (`X-Api-Key` header). Set `API_KEY` in this app's `.env` for the endpoints to work.

To run it:

```bash
cd admin
cp .env.example .env
# fill in API_KEY (must match this app's API_KEY) and TARGET_URL
# (http://localhost:3000 for local dev, or your live URL)
go run .
```

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
cp .env.prod.example .env
# fill in real values in .env
chmod 600 .env
# real guest data never lives in git or the image - place these two
# gitignored files here manually (scp from your dev machine)
#   prisma/guests-data.ts
#   prisma/fixups.ts

# the image is private - authenticate the NAS's Docker daemon once so
# both this pull and Watchtower's periodic pulls succeed. Use a GitHub
# PAT (classic or fine-grained) scoped to read:packages on this repo.
echo "$GITHUB_PAT" | docker login ghcr.io -u <your-github-username> --password-stdin

docker compose up -d
```

**Steady state**: nothing to do. A `watchtower` service polls the registry every 5 minutes and automatically pulls + restarts the `web` container when a new `latest` image is published — no manual steps for ordinary releases. Watchtower reuses the Docker daemon's stored `ghcr.io` credentials, so no extra config is needed there.

**When `docker-compose.yml` itself changes** (new services, structural changes): Watchtower only reacts to image digest changes, not compose file edits, so you still need to run `git pull && docker compose up -d` on the NAS once to pick up the change.
