import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/invitations", () => ({
    getInvitationByCode: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({
    prisma: {
        invitation: { findUnique: vi.fn(), update: vi.fn() },
        guest: { update: vi.fn() },
        activityParticipation: { deleteMany: vi.fn(), create: vi.fn() },
        boatInfo: { upsert: vi.fn() },
        $transaction: vi.fn(),
    },
}))

import { getInvitationByCode } from "@/lib/invitations"
import { prisma } from "@/lib/prisma"
import { POST } from "./route"

function makeRequest(body: unknown) {
    return new Request("http://test", {
        method: "POST",
        body: JSON.stringify(body),
    })
}

describe("POST /api/invitations/[code]/response", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns a 404 when the invitation doesn't exist", async () => {
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null)

        const response = await POST(
            makeRequest({ guests: [], activities: [] }),
            {
                params: Promise.resolve({ code: "missing" }),
            },
        )

        expect(response.status).toBe(404)
    })

    it("rejects boat spot counts outside their allowed ranges", async () => {
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
            id: 1,
        } as never)

        const tooManySpots = await POST(
            makeRequest({
                guests: [],
                activities: [],
                boatInfo: { availableSpots: 13 },
            }),
            { params: Promise.resolve({ code: "abc" }) },
        )
        expect(tooManySpots.status).toBe(400)
        expect(await tooManySpots.json()).toEqual({
            error: "availableSpots must be between 1 and 12",
        })

        const tooManyNeeded = await POST(
            makeRequest({
                guests: [],
                activities: [],
                boatInfo: { neededSpots: 5 },
            }),
            { params: Promise.resolve({ code: "abc" }) },
        )
        expect(tooManyNeeded.status).toBe(400)
        expect(await tooManyNeeded.json()).toEqual({
            error: "neededSpots must be between 1 and 4",
        })
    })

    it("saves a valid response and returns the updated invitation", async () => {
        vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
            id: 1,
        } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([])
        const updated = { id: 1, respondedAt: new Date() }
        vi.mocked(getInvitationByCode).mockResolvedValue(updated as never)

        const response = await POST(
            makeRequest({
                guests: [{ id: 1, participating: true }],
                activities: ["BBQ_MIDI"],
            }),
            { params: Promise.resolve({ code: "abc" }) },
        )

        expect(prisma.$transaction).toHaveBeenCalled()
        expect(response.status).toBe(201)
        expect(await response.json()).toEqual(
            JSON.parse(JSON.stringify(updated)),
        )
    })
})
