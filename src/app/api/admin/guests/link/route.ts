import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

type RequestBody = {
    guestIdA: number
    guestIdB: number
    keepAnswersFrom?: "A" | "B"
}

const guestWithInvitation = {
    invitation: { include: { guests: true } },
} as const

export async function POST(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const { guestIdA, guestIdB, keepAnswersFrom }: RequestBody =
        await request.json()

    if (!guestIdA || !guestIdB || guestIdA === guestIdB) {
        return Response.json(
            {
                error: "guestIdA and guestIdB must be different valid guest ids",
            },
            { status: 400 },
        )
    }

    const [guestA, guestB] = await Promise.all([
        prisma.guest.findUnique({
            where: { id: guestIdA },
            include: guestWithInvitation,
        }),
        prisma.guest.findUnique({
            where: { id: guestIdB },
            include: guestWithInvitation,
        }),
    ])

    if (!guestA || !guestB) {
        return Response.json({ error: "Guest not found" }, { status: 404 })
    }

    if (
        guestA.invitation.guests.length !== 1 ||
        guestB.invitation.guests.length !== 1
    ) {
        return Response.json(
            { error: "Both guests must be unpaired singles" },
            { status: 400 },
        )
    }

    const aResponded = guestA.invitation.respondedAt !== null
    const bResponded = guestB.invitation.respondedAt !== null

    if (aResponded && bResponded && !keepAnswersFrom) {
        return Response.json(
            {
                error: "keepAnswersFrom is required when both people have already responded",
            },
            { status: 400 },
        )
    }

    const keepA = keepAnswersFrom
        ? keepAnswersFrom === "A"
        : aResponded || !bResponded
    const target = keepA ? guestA : guestB
    const moving = keepA ? guestB : guestA

    await prisma.$transaction([
        prisma.guest.update({
            where: { id: moving.id },
            data: { invitationId: target.invitationId, partnerId: target.id },
        }),
        prisma.guest.update({
            where: { id: target.id },
            data: { partnerId: moving.id },
        }),
        prisma.activityParticipation.deleteMany({
            where: { invitationId: moving.invitationId },
        }),
        prisma.boatInfo.deleteMany({
            where: { invitationId: moving.invitationId },
        }),
        prisma.invitation.delete({ where: { id: moving.invitationId } }),
    ])

    const updated = await prisma.invitation.findUnique({
        where: { id: target.invitationId },
        include: { guests: true, activityParticipants: true, boatInfo: true },
    })

    return Response.json(updated)
}
