-- The evening BBQ slot (BBQ_SOIR) is dropped; the schedule now has a single
-- BBQ, and Descente du Rhône/BBQ_MIDI move to 11h00/14h30 (copy-only change,
-- no schema impact). Existing BBQ_SOIR responses no longer correspond to a
-- real slot, so they are deleted before the enum value is removed.
BEGIN;

DELETE FROM "ActivityParticipation" WHERE "activity" = 'BBQ_SOIR';

-- AlterEnum
CREATE TYPE "Activity_new" AS ENUM ('DESCENTE_RHONE', 'BBQ_MIDI');
ALTER TABLE "ActivityParticipation" ALTER COLUMN "activity" TYPE "Activity_new" USING ("activity"::text::"Activity_new");
ALTER TYPE "Activity" RENAME TO "Activity_old";
ALTER TYPE "Activity_new" RENAME TO "Activity";
DROP TYPE "public"."Activity_old";

COMMIT;
