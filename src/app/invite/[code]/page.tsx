import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { InviteForm } from "@/components/InviteForm"
import { getInvitationByCode } from "@/lib/invitations"

type Props = {
    params: Promise<{ code: string }>
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
