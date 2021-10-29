/*
  Warnings:

  - A unique constraint covering the columns `[unoConfigId]` on the table `Guild` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unoConfigId` to the `Guild` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "unoConfigId" INTEGER NOT NULL,
ALTER COLUMN "adminRole" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UNOConfig" (
    "id" SERIAL NOT NULL,
    "matchRoleId" TEXT,
    "unoChannelId" TEXT,

    CONSTRAINT "UNOConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_unoConfigId_key" ON "Guild"("unoConfigId");

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_unoConfigId_fkey" FOREIGN KEY ("unoConfigId") REFERENCES "UNOConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
