import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { couples, singles } from "./guests-data"
import type { CoupleEntry, SingleEntry } from "./guests-data.types"

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.POSTGRES_PRISMA_URL,
    }),
})

async function seedCouple({ code, partners: [nameA, nameB] }: CoupleEntry) {
    const invitation = await prisma.invitation.upsert({
        where: { code },
        create: { code },
        update: {},
        include: { guests: true },
    })
    if (invitation.guests.length > 0) return

    const a = await prisma.guest.create({
        data: { invitationId: invitation.id, name: nameA },
    })
    const b = await prisma.guest.create({
        data: { invitationId: invitation.id, name: nameB, partnerId: a.id },
    })
    await prisma.guest.update({
        where: { id: a.id },
        data: { partnerId: b.id },
    })
}

async function seedSingle({ code, name }: SingleEntry) {
    const invitation = await prisma.invitation.upsert({
        where: { code },
        create: { code },
        update: {},
        include: { guests: true },
    })
    if (invitation.guests.length > 0) return

    await prisma.guest.create({ data: { invitationId: invitation.id, name } })
}

async function main() {
    for (const couple of couples) await seedCouple(couple)
    for (const single of singles) await seedSingle(single)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
