import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    prisma: {
        invitation: { count: vi.fn() },
        guest: { count: vi.fn() },
        activityParticipation: { groupBy: vi.fn() },
        boatInfo: { aggregate: vi.fn() },
    },
}))

import { prisma } from "@/lib/prisma"
import { GET } from "./route"

function makeRequest() {
    return new Request("http://test", {
        headers: { "x-api-key": "test-secret-key" },
    })
}

describe("GET /api/admin/stats", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.API_KEY = "test-secret-key"
    })

    it("rejects requests without a valid API key", async () => {
        const response = await GET(new Request("http://test"))
        expect(response.status).toBe(401)
    })

    it("aggregates invitation, guest, activity, and boat stats", async () => {
        vi.mocked(prisma.invitation.count)
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(6)
        vi.mocked(prisma.guest.count)
            .mockResolvedValueOnce(8)
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(5)
        vi.mocked(prisma.activityParticipation.groupBy).mockResolvedValue([
            { activity: "BBQ_MIDI", _count: { _all: 4 } },
        ] as never)
        vi.mocked(prisma.boatInfo.aggregate).mockResolvedValue({
            _sum: { availableSpots: 10, neededSpots: 3 },
        } as never)

        const response = await GET(makeRequest())

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            invitations: { total: 10, responded: 6 },
            guests: { participating: 8, notParticipating: 2, undecided: 5 },
            activities: { BBQ_MIDI: 4 },
            boat: { availableSpots: 10, neededSpots: 3 },
        })
    })

    it("defaults boat totals to 0 when there's no boat info yet", async () => {
        vi.mocked(prisma.invitation.count).mockResolvedValue(0)
        vi.mocked(prisma.guest.count).mockResolvedValue(0)
        vi.mocked(prisma.activityParticipation.groupBy).mockResolvedValue([])
        vi.mocked(prisma.boatInfo.aggregate).mockResolvedValue({
            _sum: { availableSpots: null, neededSpots: null },
        } as never)

        const response = await GET(makeRequest())
        const body = await response.json()

        expect(body.boat).toEqual({ availableSpots: 0, neededSpots: 0 })
    })
})
