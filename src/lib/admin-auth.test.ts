import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { requireApiKey } from "./admin-auth"

describe("requireApiKey", () => {
    const originalApiKey = process.env.API_KEY

    beforeEach(() => {
        process.env.API_KEY = "test-secret-key"
    })

    afterEach(() => {
        process.env.API_KEY = originalApiKey
    })

    it("returns null when the header matches the configured key", () => {
        const request = new Request("http://test", {
            headers: { "x-api-key": "test-secret-key" },
        })

        expect(requireApiKey(request)).toBeNull()
    })

    it("returns a 401 when the header is missing", () => {
        const response = requireApiKey(new Request("http://test"))

        expect(response?.status).toBe(401)
    })

    it("returns a 401 when the header doesn't match", () => {
        const request = new Request("http://test", {
            headers: { "x-api-key": "wrong-key" },
        })

        expect(requireApiKey(request)?.status).toBe(401)
    })

    it("returns a 401 when API_KEY isn't configured", () => {
        process.env.API_KEY = ""

        const request = new Request("http://test", {
            headers: { "x-api-key": "" },
        })

        expect(requireApiKey(request)?.status).toBe(401)
    })
})
