/*
  Warnings:

  - You are about to drop the column `cardsDrawn` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cardsPlayed` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `playedGames` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `unoPoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `wonGames` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unoStatsId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unoStatsId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "cardsDrawn",
DROP COLUMN "cardsPlayed",
DROP COLUMN "playedGames",
DROP COLUMN "unoPoints",
DROP COLUMN "wonGames",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "unoStatsId" INTEGER NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "UNOStats" (
    "id" SERIAL NOT NULL,
    "unoPoints" INTEGER NOT NULL DEFAULT 0,
    "playedGames" INTEGER NOT NULL DEFAULT 0,
    "wonGames" INTEGER NOT NULL DEFAULT 0,
    "cardsPlayed" INTEGER NOT NULL DEFAULT 0,
    "cardsDrawn" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UNOStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_unoStatsId_key" ON "User"("unoStatsId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unoStatsId_fkey" FOREIGN KEY ("unoStatsId") REFERENCES "UNOStats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
