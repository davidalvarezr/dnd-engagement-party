import { notFound } from "next/navigation"
import { InviteForm } from "@/components/InviteForm"
import { getInvitationByCode } from "@/lib/invitations"

type Props = {
    params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: Props) {
    const { code } = await params

    const invitation = await getInvitationByCode(code)

    if (!invitation) notFound()

    const names = invitation.guests.map((g) => g.name).join(" & ")

    return (
        <main>
            <section>
                <h1>Hello, {names}!</h1>
            </section>

            <section>{/* Scrollable content with animations */}</section>

            <section>
                <InviteForm invitation={invitation} />
            </section>
        </main>
    )
}
