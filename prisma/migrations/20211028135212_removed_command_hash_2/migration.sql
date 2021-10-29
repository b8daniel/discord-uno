/*
  Warnings:

  - You are about to drop the column `slashCommandHash` on the `Guild` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "slashCommandHash";
