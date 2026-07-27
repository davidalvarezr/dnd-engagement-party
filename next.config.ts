import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    images: {
        // Our /public/images SVGs are self-authored static assets (no user
        // uploads), so it's safe to let next/image serve them.
        dangerouslyAllowSVG: true,
        contentSecurityPolicy:
            "default-src 'self'; script-src 'none'; sandbox;",
    },
}

export default nextConfig
