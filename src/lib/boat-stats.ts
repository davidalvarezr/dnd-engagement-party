import { cache } from "react"
import { prisma } from "./prisma"

export const boatInfoSelect = {
    availableSpots: true,
    neededSpots: true,
    invitation: { select: { guests: { select: { id: true } } } },
} as const

type BoatInfoRow = {
    availableSpots: number | null
    neededSpots: number | null
    invitation: { guests: { id: number }[] }
}

// An invitation offering boat spots is still a passenger needing a ride (1
// seat for a single guest, 2 for a couple) — it just supplies its own boat
// instead of asking for a seat.
export function sumBoatSpots(boatInfos: BoatInfoRow[]) {
    let availableSpots = 0
    let neededSpots = 0
    for (const info of boatInfos) {
        if (info.availableSpots != null) {
            availableSpots += info.availableSpots
            neededSpots += info.invitation.guests.length
        }
        if (info.neededSpots != null) {
            neededSpots += info.neededSpots
        }
    }
    return { availableSpots, neededSpots }
}

export const getBoatStats = cache(async () => {
    const [totalAttendingGuests, boatInfos] = await Promise.all([
        prisma.guest.count({ where: { participating: true } }),
        prisma.boatInfo.findMany({ select: boatInfoSelect }),
    ])

    return { ...sumBoatSpots(boatInfos), totalAttendingGuests }
})
