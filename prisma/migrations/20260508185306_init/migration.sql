-- CreateEnum
CREATE TYPE "Activity" AS ENUM ('DESCENTE_RHONE', 'BBQ_MIDI', 'BBQ_SOIR');

-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" SERIAL NOT NULL,
    "invitationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "partnerId" INTEGER,
    "participating" BOOLEAN,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipation" (
    "id" SERIAL NOT NULL,
    "invitationId" INTEGER NOT NULL,
    "activity" "Activity" NOT NULL,

    CONSTRAINT "ActivityParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoatInfo" (
    "id" SERIAL NOT NULL,
    "invitationId" INTEGER NOT NULL,
    "availableSpots" INTEGER,
    "neededSpots" INTEGER,

    CONSTRAINT "BoatInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "Invitation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_partnerId_key" ON "Guest"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "BoatInfo_invitationId_key" ON "BoatInfo"("invitationId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoatInfo" ADD CONSTRAINT "BoatInfo_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
