import { describe, expect, it } from "vitest"
import { deriveAttendance, deriveBoatChoice } from "./UpsertForm"

function guest(id: number, participating: boolean | null) {
    return {
        id,
        invitationId: 1,
        name: `Guest ${id}`,
        partnerId: null,
        participating,
    }
}

function invitation(overrides: {
    guests: ReturnType<typeof guest>[]
    boatInfo?: {
        availableSpots: number | null
        neededSpots: number | null
    } | null
}) {
    return {
        id: 1,
        code: "abc",
        respondedAt: null,
        activityParticipants: [],
        boatInfo: overrides.boatInfo ?? null,
        guests: overrides.guests,
    } as never
}

describe("deriveAttendance", () => {
    it("derives every combination for a couple", () => {
        expect(
            deriveAttendance(
                invitation({ guests: [guest(1, true), guest(2, true)] }),
            ),
        ).toBe("both")
        expect(
            deriveAttendance(
                invitation({ guests: [guest(1, true), guest(2, false)] }),
            ),
        ).toBe("guestA")
        expect(
            deriveAttendance(
                invitation({ guests: [guest(1, false), guest(2, true)] }),
            ),
        ).toBe("guestB")
        expect(
            deriveAttendance(
                invitation({ guests: [guest(1, false), guest(2, false)] }),
            ),
        ).toBe("none")
        expect(
            deriveAttendance(
                invitation({ guests: [guest(1, null), guest(2, null)] }),
            ),
        ).toBeNull()
    })

    it("derives yes/no/unanswered for a single guest", () => {
        expect(deriveAttendance(invitation({ guests: [guest(1, true)] }))).toBe(
            "yes",
        )
        expect(
            deriveAttendance(invitation({ guests: [guest(1, false)] })),
        ).toBe("no")
        expect(
            deriveAttendance(invitation({ guests: [guest(1, null)] })),
        ).toBeNull()
    })
})

describe("deriveBoatChoice", () => {
    it("reflects which boat field was previously filled in, or null otherwise", () => {
        expect(
            deriveBoatChoice(
                invitation({ guests: [guest(1, true)], boatInfo: null }),
            ),
        ).toBeNull()
        expect(
            deriveBoatChoice(
                invitation({
                    guests: [guest(1, true)],
                    boatInfo: { availableSpots: 2, neededSpots: null },
                }),
            ),
        ).toBe("has_boat")
        expect(
            deriveBoatChoice(
                invitation({
                    guests: [guest(1, true)],
                    boatInfo: { availableSpots: null, neededSpots: 2 },
                }),
            ),
        ).toBe("needs_spot")
    })
})
