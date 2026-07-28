import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import { InviteForm } from "@/components/InviteForm"
import { getBoatStats } from "@/lib/boat-stats"
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

    const names = invitation.guests.map((g) => g.name).join(" & ")
    const title = `${names} — D&D Engagement Party`
    const description =
        "⚠️ Don't share this link, it's your personal invitation ⚠️ — You are invited to our engagement party!"

    return {
        title,
        description,
        openGraph: { title, description },
        twitter: { card: "summary", title, description },
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

    const [invitation, boatStats] = await Promise.all([
        getInvitationByCode(code),
        getBoatStats(),
    ])

    if (!invitation) notFound()

    return (
        <main>
            <section>{/* Scrollable content with animations */}</section>

            <section>
                <InviteForm invitation={invitation} boatStats={boatStats} />
            </section>
        </main>
    )
}
