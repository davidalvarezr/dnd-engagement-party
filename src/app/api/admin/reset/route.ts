import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

// Typed by the admin app's danger-zone confirmation modal. Checked again
// here so the reset can't happen from a stray or scripted request.
const CONFIRMATION_PHRASE = "RESET RSVPS"

export async function POST(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const body: { confirm?: string } = await request.json()

    if (body.confirm !== CONFIRMATION_PHRASE) {
        return Response.json(
            { error: "Confirmation text does not match" },
            { status: 400 },
        )
    }

    await prisma.$transaction([
        prisma.activityParticipation.deleteMany({}),
        prisma.boatInfo.deleteMany({}),
        prisma.guest.updateMany({ data: { participating: null } }),
        prisma.invitation.updateMany({ data: { respondedAt: null } }),
    ])

    return new Response(null, { status: 204 })
}
