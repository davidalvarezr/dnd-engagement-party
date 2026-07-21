import { prisma } from "./prisma"

export function getInvitationByCode(code: string) {
    return prisma.invitation.findUnique({
        where: { code },
        include: {
            guests: true,
            activityParticipants: true,
            boatInfo: true,
        },
    })
}
