-- AlterTable
ALTER TABLE "installments" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paidAmount" DECIMAL(12,2),
ADD COLUMN     "paidAt" DATE,
ADD COLUMN     "sprintNumber" INTEGER,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "client" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "product" DROP NOT NULL,
ALTER COLUMN "po" SET DEFAULT '';

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sprints_projectId_number_key" ON "sprints"("projectId", "number");

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

