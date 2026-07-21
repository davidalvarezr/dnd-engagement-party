import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    typescript: {
        // prisma/ and scripts/ hold standalone tsx-run scripts, not app
        // code, and import prisma/guests-data.ts, which is real guest PII
        // and gitignored (host-local only, see docker-compose.yml). Point
        // the build's typecheck at a narrower project so it doesn't fail
        // in CI where that file doesn't exist.
        tsconfigPath: "./tsconfig.build.json",
    },
}

export default nextConfig
