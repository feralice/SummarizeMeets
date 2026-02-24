
-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "actionPoints",
DROP COLUMN "notes",
ADD COLUMN     "actionItems" JSONB NOT NULL,
ADD COLUMN     "decisions" JSONB NOT NULL,
ADD COLUMN     "speakers" JSONB NOT NULL,
ADD COLUMN     "topics" JSONB NOT NULL,
DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB NOT NULL;
