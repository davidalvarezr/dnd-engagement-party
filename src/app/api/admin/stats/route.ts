import { requireApiKey } from "@/lib/admin-auth"
import { boatInfoSelect, sumBoatSpots } from "@/lib/boat-stats"
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
        prisma.boatInfo.findMany({ select: boatInfoSelect }),
    ])

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
        boat: sumBoatSpots(boatInfos),
    })
}
