import { getInvitationByCode } from "@/lib/invitations"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ code: string }> },
) {
    const { code } = await params

    const invitation = await getInvitationByCode(code)

    if (!invitation) {
        return Response.json({ error: "Invitation not found" }, { status: 404 })
    }

    return Response.json(invitation)
}
