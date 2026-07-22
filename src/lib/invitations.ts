import { cache } from "react"
import { prisma } from "./prisma"

export const getInvitationByCode = cache((code: string) => {
    return prisma.invitation.findUnique({
        where: { code },
        include: {
            guests: true,
            activityParticipants: true,
            boatInfo: true,
        },
    })
})
