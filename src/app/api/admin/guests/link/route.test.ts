import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    prisma: {
        guest: { findUnique: vi.fn(), update: vi.fn() },
        invitation: { findUnique: vi.fn(), delete: vi.fn() },
        activityParticipation: { deleteMany: vi.fn() },
        boatInfo: { deleteMany: vi.fn() },
        $transaction: vi.fn(),
    },
}))

import { prisma } from "@/lib/prisma"
import { POST } from "./route"

function makeRequest(body: unknown) {
    return new Request("http://test", {
        method: "POST",
        headers: { "x-api-key": "test-secret-key" },
        body: JSON.stringify(body),
    })
}

function single(id: number, invitationId: number, respondedAt: Date | null) {
    return {
        id,
        invitationId,
        invitation: {
            id: invitationId,
            respondedAt,
            guests: [{ id }],
        },
    }
}

describe("POST /api/admin/guests/link", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.API_KEY = "test-secret-key"
    })

    it("rejects requests without a valid API key", async () => {
        const response = await POST(
            new Request("http://test", {
                method: "POST",
                body: JSON.stringify({ guestIdA: 1, guestIdB: 2 }),
            }),
        )
        expect(response.status).toBe(401)
    })

    it("rejects linking a guest to themselves", async () => {
        const response = await POST(makeRequest({ guestIdA: 1, guestIdB: 1 }))
        expect(response.status).toBe(400)
    })

    it("returns a 404 when either guest doesn't exist", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(1, 10, null) as never,
        )
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(null)

        const response = await POST(makeRequest({ guestIdA: 1, guestIdB: 2 }))
        expect(response.status).toBe(404)
    })

    it("rejects a guest who is already part of a couple", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(1, 10, null) as never,
        )
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce({
            id: 2,
            invitationId: 20,
            invitation: {
                id: 20,
                respondedAt: null,
                guests: [{ id: 2 }, { id: 3 }],
            },
        } as never)

        const response = await POST(makeRequest({ guestIdA: 1, guestIdB: 2 }))
        expect(response.status).toBe(400)
    })

    it("requires keepAnswersFrom when both have already responded", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(1, 10, new Date()) as never,
        )
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(2, 20, new Date()) as never,
        )

        const response = await POST(makeRequest({ guestIdA: 1, guestIdB: 2 }))

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "keepAnswersFrom is required when both people have already responded",
        })
    })

    it("defaults to keeping the invitation that already responded", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(1, 10, new Date()) as never,
        )
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(2, 20, null) as never,
        )
        vi.mocked(prisma.$transaction).mockResolvedValue([])
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
            id: 10,
        } as never)

        const response = await POST(makeRequest({ guestIdA: 1, guestIdB: 2 }))

        expect(prisma.guest.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { invitationId: 10, partnerId: 1 },
        })
        expect(prisma.invitation.delete).toHaveBeenCalledWith({
            where: { id: 20 },
        })
        expect(response.status).toBe(200)
    })

    it("merges into whichever invitation keepAnswersFrom picks", async () => {
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(1, 10, new Date()) as never,
        )
        vi.mocked(prisma.guest.findUnique).mockResolvedValueOnce(
            single(2, 20, new Date()) as never,
        )
        vi.mocked(prisma.$transaction).mockResolvedValue([])
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
            id: 20,
        } as never)

        const response = await POST(
            makeRequest({ guestIdA: 1, guestIdB: 2, keepAnswersFrom: "B" }),
        )

        expect(prisma.guest.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { invitationId: 20, partnerId: 2 },
        })
        expect(prisma.invitation.delete).toHaveBeenCalledWith({
            where: { id: 10 },
        })
        expect(response.status).toBe(200)
    })
})
