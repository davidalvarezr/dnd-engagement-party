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
        return Response.json({ error: "Invalid guest id" }, { status: 400 })
    }

    const guest = await prisma.guest.findUnique({
        where: { id },
        include: { invitation: { include: { guests: true } } },
    })
    if (!guest) {
        return Response.json({ error: "Guest not found" }, { status: 404 })
    }

    const partner = guest.invitation.guests.find((g) => g.id !== id)

    if (!partner) {
        // Sole guest on this invitation: remove the invitation entirely
        // rather than leave an orphaned, guest-less invite behind.
        await prisma.$transaction([
            prisma.activityParticipation.deleteMany({
                where: { invitationId: guest.invitationId },
            }),
            prisma.boatInfo.deleteMany({
                where: { invitationId: guest.invitationId },
            }),
            prisma.guest.delete({ where: { id } }),
            prisma.invitation.delete({ where: { id: guest.invitationId } }),
        ])
    } else {
        await prisma.$transaction([
            prisma.guest.update({
                where: { id: partner.id },
                data: { partnerId: null },
            }),
            prisma.guest.delete({ where: { id } }),
        ])
    }

    return new Response(null, { status: 204 })
}
