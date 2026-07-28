import { describe, expect, it } from "vitest"
import { pct, status } from "./BoatSpotsBars"

describe("pct", () => {
    it("scales a value against the total", () => {
        expect(pct(5, 10)).toBe(50)
    })

    it("caps at 100 when the value exceeds the total", () => {
        expect(pct(15, 10)).toBe(100)
    })

    it("returns 0 when there's no total to scale against", () => {
        expect(pct(5, 0)).toBe(0)
    })
})

describe("status", () => {
    it("is red when needed exceeds available", () => {
        expect(status(5, 6)).toBe("red")
    })

    it("is red when there's no available capacity at all but spots are needed", () => {
        expect(status(0, 1)).toBe("red")
    })

    it("is green when nothing is offered and nothing is needed", () => {
        expect(status(0, 0)).toBe("green")
    })

    it("is green when needed is well under 80% of available", () => {
        expect(status(10, 5)).toBe("green")
    })

    it("is green exactly at the 80% boundary", () => {
        expect(status(10, 8)).toBe("green")
    })

    it("is orange just over the 80% boundary", () => {
        expect(status(10, 9)).toBe("orange")
    })

    it("is orange when needed exactly matches available", () => {
        expect(status(10, 10)).toBe("orange")
    })
})
