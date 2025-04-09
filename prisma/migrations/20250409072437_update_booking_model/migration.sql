/*
  Warnings:

  - Added the required column `token_number` to the `booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "token_number" TEXT NOT NULL;
