import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import { InviteForm } from "@/components/InviteForm"
import { getInvitationByCode } from "@/lib/invitations"

type Props = {
    params: Promise<{ code: string }>
}

export const viewport: Viewport = {
    themeColor: "#19989e",
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params

    const invitation = await getInvitationByCode(code)
    if (!invitation) return {}

    return {
        title: "D&D Engagement Party",
        manifest: `/invite/${code}/manifest.webmanifest`,
        appleWebApp: {
            capable: true,
            title: "D&D Party",
            statusBarStyle: "default",
        },
        icons: {
            apple: "/icons/apple-touch-icon.png",
        },
    }
}

export default async function InvitePage({ params }: Props) {
    const { code } = await params

    const invitation = await getInvitationByCode(code)

    if (!invitation) notFound()

    return (
        <main>
            <section>{/* Scrollable content with animations */}</section>

            <section>
                <InviteForm invitation={invitation} />
            </section>
        </main>
    )
}
