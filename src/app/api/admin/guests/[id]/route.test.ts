import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    prisma: {
        guest: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
        invitation: { delete: vi.fn() },
        activityParticipation: { deleteMany: vi.fn() },
        boatInfo: { deleteMany: vi.fn() },
        $transaction: vi.fn(),
    },
}))

import { prisma } from "@/lib/prisma"
import { DELETE } from "./route"

function makeRequest() {
    return new Request("http://test", {
        method: "DELETE",
        headers: { "x-api-key": "test-secret-key" },
    })
}

describe("DELETE /api/admin/guests/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.API_KEY = "test-secret-key"
    })

    it("rejects requests without a valid API key", async () => {
        const response = await DELETE(
            new Request("http://test", { method: "DELETE" }),
            {
                params: Promise.resolve({ id: "1" }),
            },
        )
        expect(response.status).toBe(401)
    })

    it("returns a 404 when the guest doesn't exist", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValue(null)

        const response = await DELETE(makeRequest(), {
            params: Promise.resolve({ id: "1" }),
        })

        expect(response.status).toBe(404)
    })

    it("deletes the whole invitation when the guest is the sole guest", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValue({
            id: 1,
            invitationId: 10,
            invitation: { guests: [{ id: 1 }] },
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([])

        const response = await DELETE(makeRequest(), {
            params: Promise.resolve({ id: "1" }),
        })

        expect(prisma.activityParticipation.deleteMany).toHaveBeenCalledWith({
            where: { invitationId: 10 },
        })
        expect(prisma.boatInfo.deleteMany).toHaveBeenCalledWith({
            where: { invitationId: 10 },
        })
        expect(prisma.guest.delete).toHaveBeenCalledWith({ where: { id: 1 } })
        expect(prisma.invitation.delete).toHaveBeenCalledWith({
            where: { id: 10 },
        })
        expect(response.status).toBe(204)
    })

    it("only clears the partner link when the guest has a partner", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValue({
            id: 1,
            invitationId: 10,
            invitation: {
                guests: [{ id: 1 }, { id: 2 }],
            },
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([])

        const response = await DELETE(makeRequest(), {
            params: Promise.resolve({ id: "1" }),
        })

        expect(prisma.guest.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { partnerId: null },
        })
        expect(prisma.guest.delete).toHaveBeenCalledWith({ where: { id: 1 } })
        expect(prisma.invitation.delete).not.toHaveBeenCalled()
        expect(response.status).toBe(204)
    })
})
