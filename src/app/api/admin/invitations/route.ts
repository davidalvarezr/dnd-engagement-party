import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

const include = {
    guests: true,
    activityParticipants: true,
    boatInfo: true,
} as const

// Typed by the admin app's danger-zone confirmation modal. Checked again
// here so all invitees can't be wiped by a stray or scripted request.
const DELETE_ALL_CONFIRMATION_PHRASE = "DELETE ALL INVITEES"

export async function GET(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const invitations = await prisma.invitation.findMany({
        include,
        orderBy: { id: "asc" },
    })

    return Response.json(invitations)
}

export async function POST(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const body: { name?: string } = await request.json()
    const name = body.name?.trim()

    if (!name) {
        return Response.json({ error: "name is required" }, { status: 400 })
    }

    const invitation = await prisma.invitation.create({
        data: { guests: { create: { name } } },
        include,
    })

    return Response.json(invitation, { status: 201 })
}

export async function DELETE(request: Request) {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const body: { confirm?: string } = await request.json()

    if (body.confirm !== DELETE_ALL_CONFIRMATION_PHRASE) {
        return Response.json(
            { error: "Confirmation text does not match" },
            { status: 400 },
        )
    }

    await prisma.$transaction([
        prisma.activityParticipation.deleteMany({}),
        prisma.boatInfo.deleteMany({}),
        prisma.guest.deleteMany({}),
        prisma.invitation.deleteMany({}),
    ])

    return new Response(null, { status: 204 })
}
