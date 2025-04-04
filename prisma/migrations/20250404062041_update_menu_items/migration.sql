/*
  Warnings:

  - You are about to drop the column `description` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `sub_category` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `sub_category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[category_name]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category_name` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_name` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_price` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sub_category_name` to the `sub_category` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "category_name_key";

-- AlterTable
ALTER TABLE "category" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "category_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "price",
ADD COLUMN     "item_description" TEXT,
ADD COLUMN     "item_name" TEXT NOT NULL,
ADD COLUMN     "item_price" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sub_category" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "sub_category_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "category_category_name_key" ON "category"("category_name");
