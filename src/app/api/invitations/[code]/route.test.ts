import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/invitations", () => ({
    getInvitationByCode: vi.fn(),
}))

import { getInvitationByCode } from "@/lib/invitations"
import { GET } from "./route"

describe("GET /api/invitations/[code]", () => {
    it("returns a 404 when the invitation doesn't exist", async () => {
        vi.mocked(getInvitationByCode).mockResolvedValue(null)

        const response = await GET(new Request("http://test"), {
            params: Promise.resolve({ code: "missing" }),
        })

        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ error: "Invitation not found" })
    })

    it("returns the invitation as JSON when found", async () => {
        const invitation = { id: 1, code: "abc", guests: [] }
        vi.mocked(getInvitationByCode).mockResolvedValue(invitation as never)

        const response = await GET(new Request("http://test"), {
            params: Promise.resolve({ code: "abc" }),
        })

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual(invitation)
    })
})
