/*
  Warnings:

  - You are about to drop the column `total_charge` on the `order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "total_charge",
ADD COLUMN     "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
