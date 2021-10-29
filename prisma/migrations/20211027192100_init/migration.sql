-- CreateTable
CREATE TABLE "Guild" (
    "guildId" TEXT NOT NULL,
    "adminRole" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT E'un!'
);

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "unoPoints" INTEGER NOT NULL DEFAULT 0,
    "playedGames" INTEGER NOT NULL DEFAULT 0,
    "wonGames" INTEGER NOT NULL DEFAULT 0,
    "cardsPlayed" INTEGER NOT NULL DEFAULT 0,
    "cardsDrawn" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guildId_key" ON "Guild"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
