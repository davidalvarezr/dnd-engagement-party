import { requireApiKey } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

const include = {
    guests: true,
    activityParticipants: true,
    boatInfo: true,
} as const

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
