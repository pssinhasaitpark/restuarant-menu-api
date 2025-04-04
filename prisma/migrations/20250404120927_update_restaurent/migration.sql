/*
  Warnings:

  - You are about to drop the column `qr_code_url` on the `menu_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "qr_code_url",
ADD COLUMN     "c" TEXT;

-- AlterTable
ALTER TABLE "restaurant" ADD COLUMN     "qr_code_url" TEXT DEFAULT 'qrl code url';
