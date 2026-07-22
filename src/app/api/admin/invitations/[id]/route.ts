import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const id = Number((await params).id)
    if (Number.isNaN(id)) {
        return Response.json(
            { error: "Invalid invitation id" },
            { status: 400 },
        )
    }

    const invitation = await prisma.invitation.findUnique({ where: { id } })
    if (!invitation) {
        return Response.json({ error: "Invitation not found" }, { status: 404 })
    }

    await prisma.$transaction([
        prisma.activityParticipation.deleteMany({
            where: { invitationId: id },
        }),
        prisma.boatInfo.deleteMany({ where: { invitationId: id } }),
        prisma.guest.deleteMany({ where: { invitationId: id } }),
        prisma.invitation.delete({ where: { id } }),
    ])

    return new Response(null, { status: 204 })
}
