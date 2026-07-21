import { describe, expect, it } from "vitest"
import { couples, singles } from "./guests-data"

describe("guests-data", () => {
    it("has a unique, non-empty invitation code for every couple and single entry", () => {
        const codes = [
            ...couples.map((c) => c.code),
            ...singles.map((s) => s.code),
        ]

        expect(codes.length).toBeGreaterThan(0)
        for (const code of codes) {
            expect(code).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            )
        }
        expect(new Set(codes).size).toBe(codes.length)
    })
})
