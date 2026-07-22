import { NextResponse } from "next/server"

type Props = {
    params: Promise<{ code: string }>
}

export async function GET(_request: Request, { params }: Props) {
    const { code } = await params
    const scope = `/invite/${code}`

    return NextResponse.json(
        {
            name: "D&D Engagement Party",
            short_name: "D&D Party",
            description: "RSVP and details for our D&D-themed engagement party",
            start_url: scope,
            scope,
            display: "standalone",
            background_color: "#19989e",
            theme_color: "#19989e",
            icons: [
                {
                    src: "/icons/icon-192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    src: "/icons/icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
                {
                    src: "/icons/icon-512-maskable.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                },
            ],
        },
        { headers: { "Content-Type": "application/manifest+json" } },
    )
}
