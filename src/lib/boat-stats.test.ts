import { describe, expect, it, vi } from "vitest"

vi.mock("./prisma", () => ({
    prisma: { guest: { count: vi.fn() }, boatInfo: { findMany: vi.fn() } },
}))

import { sumBoatSpots } from "./boat-stats"

describe("sumBoatSpots", () => {
    it("counts an offering couple's own headcount as also needing a ride", () => {
        const result = sumBoatSpots([
            {
                availableSpots: 3,
                neededSpots: null,
                invitation: { guests: [{ id: 1 }, { id: 2 }] },
            },
        ])

        expect(result).toEqual({ availableSpots: 3, neededSpots: 2 })
    })

    it("counts an offering single guest's own headcount as also needing a ride", () => {
        const result = sumBoatSpots([
            {
                availableSpots: 2,
                neededSpots: null,
                invitation: { guests: [{ id: 1 }] },
            },
        ])

        expect(result).toEqual({ availableSpots: 2, neededSpots: 1 })
    })

    it("adds explicit needed-spot answers on top of offering headcounts", () => {
        const result = sumBoatSpots([
            {
                availableSpots: 3,
                neededSpots: null,
                invitation: { guests: [{ id: 1 }, { id: 2 }] },
            },
            {
                availableSpots: null,
                neededSpots: 1,
                invitation: { guests: [{ id: 3 }] },
            },
        ])

        expect(result).toEqual({ availableSpots: 3, neededSpots: 3 })
    })

    it("returns zeros when there's no boat info yet", () => {
        expect(sumBoatSpots([])).toEqual({ availableSpots: 0, neededSpots: 0 })
    })
})
