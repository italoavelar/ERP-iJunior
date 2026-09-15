-- AlterTable
ALTER TABLE "projects" DROP COLUMN "nextDate",
DROP COLUMN "nfIssued";

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "nfIssued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "installments_projectId_paid_idx" ON "installments"("projectId", "paid");

-- CreateIndex
CREATE UNIQUE INDEX "installments_projectId_number_key" ON "installments"("projectId", "number");

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

