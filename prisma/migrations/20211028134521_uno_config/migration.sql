/*
  Warnings:

  - You are about to drop the `UNOConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UNOStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Guild" DROP CONSTRAINT "Guild_unoConfigId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_unoStatsId_fkey";

-- DropTable
DROP TABLE "UNOConfig";

-- DropTable
DROP TABLE "UNOStats";

-- CreateTable
CREATE TABLE "UnoStats" (
    "id" SERIAL NOT NULL,
    "unoPoints" INTEGER NOT NULL DEFAULT 0,
    "playedGames" INTEGER NOT NULL DEFAULT 0,
    "wonGames" INTEGER NOT NULL DEFAULT 0,
    "cardsPlayed" INTEGER NOT NULL DEFAULT 0,
    "cardsDrawn" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UnoStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnoConfig" (
    "id" SERIAL NOT NULL,
    "matchRoleId" TEXT,
    "unoChannelId" TEXT,

    CONSTRAINT "UnoConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_unoConfigId_fkey" FOREIGN KEY ("unoConfigId") REFERENCES "UnoConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unoStatsId_fkey" FOREIGN KEY ("unoStatsId") REFERENCES "UnoStats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
