import { describe, expect, it } from "vitest"
import type { CoupleEntry, SingleEntry } from "./guests-data.types"

let real: { couples: CoupleEntry[]; singles: SingleEntry[] } | undefined
try {
    real = await import("./guests-data")
} catch {
    real = undefined
}

describe.skipIf(!real)(
    "guests-data (skipped when prisma/guests-data.ts is absent, e.g. in CI)",
    () => {
        it("has a unique, non-empty invitation code for every couple and single entry", () => {
            if (!real) throw new Error("unreachable: suite is skipped")
            const codes = [
                ...real.couples.map((c) => c.code),
                ...real.singles.map((s) => s.code),
            ]

            expect(codes.length).toBeGreaterThan(0)
            for (const code of codes) {
                expect(code).toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
                )
            }
            expect(new Set(codes).size).toBe(codes.length)
        })
    },
)
