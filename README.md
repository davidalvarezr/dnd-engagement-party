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

**CI flow**: every push to `main` triggers `.github/workflows/release.yml`, which computes the next semver tag from conventional commits, builds the Docker image, and pushes it to Docker Hub as `devdav2/dnd-engagement-party:vX.Y.Z` and `:latest`.

**One-time NAS setup**:

```bash
git clone <repo-url>
cd dnd-engagement-party
cp .env.prod.example .env
# fill in real values in .env
chmod 600 .env
docker compose up -d
```

**Steady state**: nothing to do. A `watchtower` service polls Docker Hub every 5 minutes and automatically pulls + restarts the `web` container when a new `latest` image is published — no manual steps for ordinary releases.

**When `docker-compose.yml` itself changes** (new services, structural changes): Watchtower only reacts to image digest changes, not compose file edits, so you still need to run `git pull && docker compose up -d` on the NAS once to pick up the change.
