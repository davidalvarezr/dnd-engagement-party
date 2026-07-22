import { timingSafeEqual } from "node:crypto"

export function requireApiKey(request: Request): Response | null {
    const provided = request.headers.get("x-api-key") ?? ""
    const expected = process.env.API_KEY ?? ""

    const providedBuffer = Buffer.from(provided)
    const expectedBuffer = Buffer.from(expected)

    const isValid =
        expected.length > 0 &&
        providedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(providedBuffer, expectedBuffer)

    if (!isValid) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    return null
}
