import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
    prisma: {
        invitation: { findMany: vi.fn(), create: vi.fn() },
    },
}))

import { prisma } from "@/lib/prisma"
import { GET, POST } from "./route"

function makeGetRequest() {
    return new Request("http://test", {
        headers: { "x-api-key": "test-secret-key" },
    })
}

function makePostRequest(body: unknown) {
    return new Request("http://test", {
        method: "POST",
        headers: { "x-api-key": "test-secret-key" },
        body: JSON.stringify(body),
    })
}

describe("/api/admin/invitations", () => {
    const originalApiKey = process.env.API_KEY

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.API_KEY = "test-secret-key"
    })

    afterAll(() => {
        process.env.API_KEY = originalApiKey
    })

    describe("GET", () => {
        it("rejects requests without a valid API key", async () => {
            const response = await GET(new Request("http://test"))
            expect(response.status).toBe(401)
        })

        it("returns every invitation with guests, activities, and boat info", async () => {
            const invitations = [{ id: 1, code: "abc", guests: [] }]
            vi.mocked(prisma.invitation.findMany).mockResolvedValue(
                invitations as never,
            )

            const response = await GET(makeGetRequest())

            expect(response.status).toBe(200)
            expect(await response.json()).toEqual(invitations)
        })
    })

    describe("POST", () => {
        it("rejects requests without a valid API key", async () => {
            const response = await POST(
                new Request("http://test", {
                    method: "POST",
                    body: JSON.stringify({ name: "Alex" }),
                }),
            )
            expect(response.status).toBe(401)
        })

        it("rejects a missing or blank name", async () => {
            const response = await POST(makePostRequest({ name: "  " }))

            expect(response.status).toBe(400)
            expect(await response.json()).toEqual({ error: "name is required" })
        })

        it("creates a new single invitee", async () => {
            const created = {
                id: 2,
                code: "xyz",
                guests: [{ id: 3, name: "Alex" }],
            }
            vi.mocked(prisma.invitation.create).mockResolvedValue(
                created as never,
            )

            const response = await POST(makePostRequest({ name: "Alex" }))

            expect(prisma.invitation.create).toHaveBeenCalledWith({
                data: { guests: { create: { name: "Alex" } } },
                include: {
                    guests: true,
                    activityParticipants: true,
                    boatInfo: true,
                },
            })
            expect(response.status).toBe(201)
            expect(await response.json()).toEqual(created)
        })
    })
})
