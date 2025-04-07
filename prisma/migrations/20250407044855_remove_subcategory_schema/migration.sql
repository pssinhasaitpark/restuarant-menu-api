/*
  Warnings:

  - You are about to drop the column `c` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `sub_category_id` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the `sub_category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category_id` to the `menu_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_sub_category_id_fkey";

-- DropForeignKey
ALTER TABLE "sub_category" DROP CONSTRAINT "sub_category_category_id_fkey";

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "c",
DROP COLUMN "sub_category_id",
ADD COLUMN     "category_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "restaurant" ADD COLUMN     "wishlist" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "sub_category";

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
