import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

const txMock = {
    invitation: { create: vi.fn() },
    guest: { update: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({
    prisma: {
        invitation: { findMany: vi.fn() },
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

const FAKE_CODE_1 = "00000000-0000-4000-8000-000000000001"
const FAKE_CODE_2 = "00000000-0000-4000-8000-000000000002"

describe("/api/admin/invitations/import", () => {
    const originalApiKey = process.env.API_KEY

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.API_KEY = "test-secret-key"
        vi.mocked(prisma.invitation.findMany).mockResolvedValue([] as never)
        vi.mocked(prisma.$transaction).mockImplementation((fn: unknown) =>
            (fn as (tx: typeof txMock) => Promise<unknown>)(txMock),
        )
    })

    afterAll(() => {
        process.env.API_KEY = originalApiKey
    })

    it("rejects requests without a valid API key", async () => {
        const response = await POST(
            new Request("http://test", {
                method: "POST",
                body: JSON.stringify({ dryRun: true, rows: [] }),
            }),
        )
        expect(response.status).toBe(401)
    })

    it("rejects a missing rows array", async () => {
        const response = await POST(makeRequest({ dryRun: true }))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "rows is required" })
    })

    it("rejects an empty rows array", async () => {
        const response = await POST(makeRequest({ dryRun: true, rows: [] }))
        expect(response.status).toBe(400)
    })

    it("rejects a non-array rows value", async () => {
        const response = await POST(makeRequest({ dryRun: true, rows: "nope" }))
        expect(response.status).toBe(400)
    })

    it("dry-runs a mixed batch: new single, new couple, exact-match skip, code collision error", async () => {
        vi.mocked(prisma.invitation.findMany).mockResolvedValue([
            {
                id: 1,
                code: FAKE_CODE_1,
                guests: [{ id: 1, name: "Alice Example" }],
            },
            {
                id: 2,
                code: FAKE_CODE_2,
                guests: [
                    { id: 2, name: "Carol Example" },
                    { id: 3, name: "Dave Example" },
                ],
            },
        ] as never)

        const rows = [
            { line: 2, guest1: "Erin Example", guest2: "", code: "" },
            {
                line: 3,
                guest1: "Frank Example",
                guest2: "Grace Example",
                code: "",
            },
            { line: 4, guest1: "Alice Example", guest2: "", code: "" },
            {
                line: 5,
                guest1: "Someone Else",
                guest2: "",
                code: FAKE_CODE_2,
            },
        ]

        const response = await POST(makeRequest({ dryRun: true, rows }))
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.applied).toBe(false)
        expect(body.totals).toEqual({ create: 2, skip: 1, error: 1 })

        const byLine = Object.fromEntries(
            body.rows.map((r: { line: number }) => [r.line, r]),
        )
        expect(byLine[2].status).toBe("create")
        expect(byLine[3].status).toBe("create")
        expect(byLine[4].status).toBe("skip")
        expect(byLine[5].status).toBe("error")
        expect(byLine[5].reason).toMatch(/different names/)

        expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("flags a duplicate name across rows in the file", async () => {
        const rows = [
            { line: 2, guest1: "Alice Example", guest2: "", code: "" },
            { line: 3, guest1: "Alice Example", guest2: "", code: "" },
        ]

        const response = await POST(makeRequest({ dryRun: true, rows }))
        const body = await response.json()

        expect(body.totals).toEqual({ create: 0, skip: 0, error: 2 })
        expect(body.rows[0].status).toBe("error")
        expect(body.rows[0].reason).toMatch(/duplicate name in file/)
        expect(body.rows[1].status).toBe("error")
    })

    it("flags guest1 equal to guest2", async () => {
        const rows = [
            {
                line: 2,
                guest1: "Alice Example",
                guest2: "Alice Example",
                code: "",
            },
        ]

        const response = await POST(makeRequest({ dryRun: true, rows }))
        const body = await response.json()

        expect(body.rows[0].status).toBe("error")
        expect(body.rows[0].reason).toMatch(/must be different/)
    })

    it("flags an invalid UUID code", async () => {
        const rows = [
            {
                line: 2,
                guest1: "Alice Example",
                guest2: "",
                code: "not-a-uuid",
            },
        ]

        const response = await POST(makeRequest({ dryRun: true, rows }))
        const body = await response.json()

        expect(body.rows[0].status).toBe("error")
        expect(body.rows[0].reason).toMatch(/invalid code format/)
    })

    it("flags a duplicate code across rows in the file", async () => {
        const rows = [
            {
                line: 2,
                guest1: "Alice Example",
                guest2: "",
                code: FAKE_CODE_1,
            },
            {
                line: 3,
                guest1: "Bob Example",
                guest2: "",
                code: FAKE_CODE_1,
            },
        ]

        const response = await POST(makeRequest({ dryRun: true, rows }))
        const body = await response.json()

        expect(body.rows[0].status).toBe("error")
        expect(body.rows[0].reason).toMatch(/duplicate code in file/)
        expect(body.rows[1].status).toBe("error")
    })

    it("flags a name that exists under a different invitation", async () => {
        vi.mocked(prisma.invitation.findMany).mockResolvedValue([
            {
                id: 1,
                code: FAKE_CODE_1,
                guests: [{ id: 1, name: "Alice Example" }],
            },
        ] as never)

        const rows = [
            {
                line: 2,
                guest1: "Alice Example",
                guest2: "New Partner",
                code: "",
            },
        ]

        const response = await POST(makeRequest({ dryRun: true, rows }))
        const body = await response.json()

        expect(body.rows[0].status).toBe("error")
        expect(body.rows[0].reason).toMatch(
            /already exists under a different invitation/,
        )
    })

    it("applies a confirmed import: creates invitations and links partners", async () => {
        vi.mocked(prisma.invitation.findMany).mockResolvedValue([] as never)
        vi.mocked(txMock.invitation.create)
            .mockResolvedValueOnce({
                id: 10,
                code: "auto-1",
                guests: [{ id: 100, name: "Erin Example" }],
            } as never)
            .mockResolvedValueOnce({
                id: 11,
                code: "auto-2",
                guests: [
                    { id: 101, name: "Frank Example" },
                    { id: 102, name: "Grace Example" },
                ],
            } as never)

        const rows = [
            { line: 2, guest1: "Erin Example", guest2: "", code: "" },
            {
                line: 3,
                guest1: "Frank Example",
                guest2: "Grace Example",
                code: "",
            },
        ]

        const response = await POST(makeRequest({ dryRun: false, rows }))
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(prisma.$transaction).toHaveBeenCalledTimes(1)
        expect(txMock.invitation.create).toHaveBeenNthCalledWith(1, {
            data: { guests: { create: [{ name: "Erin Example" }] } },
            include: { guests: true },
        })
        expect(txMock.invitation.create).toHaveBeenNthCalledWith(2, {
            data: {
                guests: {
                    create: [
                        { name: "Frank Example" },
                        { name: "Grace Example" },
                    ],
                },
            },
            include: { guests: true },
        })
        expect(txMock.guest.update).toHaveBeenCalledWith({
            where: { id: 101 },
            data: { partnerId: 102 },
        })
        expect(txMock.guest.update).toHaveBeenCalledWith({
            where: { id: 102 },
            data: { partnerId: 101 },
        })
        expect(txMock.guest.update).toHaveBeenCalledTimes(2)
        expect(body.applied).toBe(true)
        expect(body.created).toBe(2)
    })

    it("rejects a confirm when rows have errors, without writing", async () => {
        const rows = [
            { line: 2, guest1: "", guest2: "", code: "" },
            { line: 3, guest1: "Bob Example", guest2: "", code: "" },
        ]

        const response = await POST(makeRequest({ dryRun: false, rows }))

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "cannot apply: 1 row(s) have errors",
        })
        expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("re-importing an all-matching file is idempotent (created: 0)", async () => {
        vi.mocked(prisma.invitation.findMany).mockResolvedValue([
            {
                id: 1,
                code: FAKE_CODE_1,
                guests: [{ id: 1, name: "Alice Example" }],
            },
        ] as never)

        const rows = [
            { line: 2, guest1: "Alice Example", guest2: "", code: "" },
        ]

        const response = await POST(makeRequest({ dryRun: false, rows }))
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.totals).toEqual({ create: 0, skip: 1, error: 0 })
        expect(body.created).toBe(0)
        expect(txMock.invitation.create).not.toHaveBeenCalled()
    })
})
