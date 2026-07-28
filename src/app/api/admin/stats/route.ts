import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const [
        totalInvitations,
        respondedInvitations,
        participatingGuests,
        notParticipatingGuests,
        undecidedGuests,
        activityCounts,
        boatInfos,
    ] = await Promise.all([
        prisma.invitation.count(),
        prisma.invitation.count({ where: { respondedAt: { not: null } } }),
        prisma.guest.count({ where: { participating: true } }),
        prisma.guest.count({ where: { participating: false } }),
        prisma.guest.count({ where: { participating: null } }),
        prisma.activityParticipation.groupBy({
            by: ["activity"],
            _count: { _all: true },
        }),
        prisma.boatInfo.findMany({
            select: {
                availableSpots: true,
                neededSpots: true,
                invitation: { select: { guests: { select: { id: true } } } },
            },
        }),
    ])

    // Offering a boat doesn't remove that guest's own need for a ride: a
    // single offering guest still occupies 1 seat, a couple 2.
    let boatAvailableSpots = 0
    let boatNeededSpots = 0
    for (const info of boatInfos) {
        if (info.availableSpots != null) {
            boatAvailableSpots += info.availableSpots
            boatNeededSpots += info.invitation.guests.length
        }
        if (info.neededSpots != null) {
            boatNeededSpots += info.neededSpots
        }
    }

    return Response.json({
        invitations: {
            total: totalInvitations,
            responded: respondedInvitations,
        },
        guests: {
            participating: participatingGuests,
            notParticipating: notParticipatingGuests,
            undecided: undecidedGuests,
        },
        activities: Object.fromEntries(
            activityCounts.map((row) => [row.activity, row._count._all]),
        ),
        boat: {
            availableSpots: boatAvailableSpots,
            neededSpots: boatNeededSpots,
        },
    })
}
