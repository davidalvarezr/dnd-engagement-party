import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    prisma: {
        activityParticipation: { deleteMany: vi.fn() },
        boatInfo: { deleteMany: vi.fn() },
        guest: { updateMany: vi.fn() },
        invitation: { updateMany: vi.fn() },
        $transaction: vi.fn(),
    },
}))

import { prisma } from "@/lib/prisma"
import { POST } from "./route"

function makeRequest(body: unknown) {
    return new Request("http://test", {
        method: "POST",
        headers: {
            "x-api-key": "test-secret-key",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })
}

describe("POST /api/admin/reset", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.API_KEY = "test-secret-key"
    })

    it("rejects requests without a valid API key", async () => {
        const response = await POST(
            new Request("http://test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirm: "RESET RSVPS" }),
            }),
        )
        expect(response.status).toBe(401)
    })

    it("rejects a request whose confirmation text doesn't match", async () => {
        const response = await POST(makeRequest({ confirm: "nope" }))

        expect(response.status).toBe(400)
        expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("rejects a request with no confirmation text", async () => {
        const response = await POST(makeRequest({}))

        expect(response.status).toBe(400)
        expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("clears RSVP data but leaves invitees and pairings alone", async () => {
        vi.mocked(prisma.$transaction).mockResolvedValue([])

        const response = await POST(makeRequest({ confirm: "RESET RSVPS" }))

        expect(response.status).toBe(204)
        expect(prisma.$transaction).toHaveBeenCalledTimes(1)
        expect(prisma.activityParticipation.deleteMany).toHaveBeenCalledWith({})
        expect(prisma.boatInfo.deleteMany).toHaveBeenCalledWith({})
        expect(prisma.guest.updateMany).toHaveBeenCalledWith({
            data: { participating: null },
        })
        expect(prisma.invitation.updateMany).toHaveBeenCalledWith({
            data: { respondedAt: null },
        })
    })
})
