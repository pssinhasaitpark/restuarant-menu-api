/*
  Warnings:

  - You are about to drop the column `contact_no` on the `order` table. All the data in the column will be lost.
  - Added the required column `email` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "contact_no",
ADD COLUMN     "email" TEXT NOT NULL;
