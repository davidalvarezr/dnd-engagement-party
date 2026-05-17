import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { couples, singles, type CoupleEntry, type SingleEntry } from "./guests-data"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function seedCouple({ code, partners: [nameA, nameB] }: CoupleEntry) {
  const invitation = await prisma.invitation.create({ data: { code } })
  const a = await prisma.guest.create({ data: { invitationId: invitation.id, name: nameA } })
  const b = await prisma.guest.create({ data: { invitationId: invitation.id, name: nameB, partnerId: a.id } })
  await prisma.guest.update({ where: { id: a.id }, data: { partnerId: b.id } })
}

async function seedSingle({ code, name }: SingleEntry) {
  const { id: invitationId } = await prisma.invitation.create({ data: { code } })
  await prisma.guest.create({ data: { invitationId, name } })
}

async function main() {
  for (const couple of couples) await seedCouple(couple)
  for (const single of singles) await seedSingle(single)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
