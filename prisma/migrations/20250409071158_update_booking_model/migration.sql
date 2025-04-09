/*
  Warnings:

  - You are about to drop the column `available` on the `menu_items` table. All the data in the column will be lost.
  - Added the required column `token_number` to the `booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "token_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "available";
