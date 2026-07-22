import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    prisma: {
        invitation: { findUnique: vi.fn(), delete: vi.fn() },
        guest: { deleteMany: vi.fn() },
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

describe("DELETE /api/admin/invitations/[id]", () => {
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

    it("returns a 400 for a non-numeric id", async () => {
        const response = await DELETE(makeRequest(), {
            params: Promise.resolve({ id: "nope" }),
        })
        expect(response.status).toBe(400)
    })

    it("returns a 404 when the invitation doesn't exist", async () => {
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null)

        const response = await DELETE(makeRequest(), {
            params: Promise.resolve({ id: "1" }),
        })

        expect(response.status).toBe(404)
    })

    it("deletes the invitation and all of its related rows", async () => {
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
            id: 1,
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([])

        const response = await DELETE(makeRequest(), {
            params: Promise.resolve({ id: "1" }),
        })

        expect(prisma.$transaction).toHaveBeenCalled()
        expect(response.status).toBe(204)
    })
})
