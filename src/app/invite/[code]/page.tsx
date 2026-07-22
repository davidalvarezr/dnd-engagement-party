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

    return { title: "D&D Engagement Party" }
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
