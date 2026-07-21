import { getInvitationByCode } from "@/lib/invitations"
import { prisma } from "@/lib/prisma"

type GuestResponse = { id: number; participating: boolean }
type Activity = "DESCENTE_RHONE" | "BBQ_MIDI" | "BBQ_SOIR"

type RequestBody = {
    guests: GuestResponse[]
    activities: Activity[]
    boatInfo?: { availableSpots?: number; neededSpots?: number }
}

function validateBody(body: RequestBody): string | null {
    const { availableSpots, neededSpots } = body.boatInfo ?? {}
    if (
        availableSpots !== undefined &&
        (availableSpots < 1 || availableSpots > 12)
    ) {
        return "availableSpots must be between 1 and 12"
    }
    if (neededSpots !== undefined && (neededSpots < 1 || neededSpots > 4)) {
        return "neededSpots must be between 1 and 4"
    }
    return null
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> },
) {
    const { code } = await params

    const invitation = await prisma.invitation.findUnique({ where: { code } })

    if (!invitation) {
        return Response.json({ error: "Invitation not found" }, { status: 404 })
    }

    const body: RequestBody = await request.json()

    const validationError = validateBody(body)
    if (validationError) {
        return Response.json({ error: validationError }, { status: 400 })
    }

    await prisma.$transaction([
        // Update participating status per guest
        ...body.guests.map((guest) =>
            prisma.guest.update({
                where: { id: guest.id },
                data: { participating: guest.participating },
            }),
        ),

        // Replace activity participations
        prisma.activityParticipation.deleteMany({
            where: { invitationId: invitation.id },
        }),
        ...body.activities.map((activity) =>
            prisma.activityParticipation.create({
                data: { invitationId: invitation.id, activity },
            }),
        ),

        // Upsert boat info
        prisma.boatInfo.upsert({
            where: { invitationId: invitation.id },
            create: {
                invitationId: invitation.id,
                availableSpots: body.boatInfo?.availableSpots ?? null,
                neededSpots: body.boatInfo?.neededSpots ?? null,
            },
            update: {
                availableSpots: body.boatInfo?.availableSpots ?? null,
                neededSpots: body.boatInfo?.neededSpots ?? null,
            },
        }),

        // Mark invitation as responded
        prisma.invitation.update({
            where: { id: invitation.id },
            data: { respondedAt: new Date() },
        }),
    ])

    const updated = await getInvitationByCode(code)
    return Response.json(updated, { status: 201 })
}
