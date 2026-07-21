import { describe, expect, it, vi } from "vitest"

vi.mock("./prisma", () => ({
    prisma: {
        invitation: {
            findUnique: vi.fn(),
        },
    },
}))

import { getInvitationByCode } from "./invitations"
import { prisma } from "./prisma"

describe("getInvitationByCode", () => {
    it("queries prisma by code with guests, activities and boat info included", async () => {
        const mockInvitation = { id: 1, code: "abc" }
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
            mockInvitation as never,
        )

        const result = await getInvitationByCode("abc")

        expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
            where: { code: "abc" },
            include: {
                guests: true,
                activityParticipants: true,
                boatInfo: true,
            },
        })
        expect(result).toBe(mockInvitation)
    })
})
