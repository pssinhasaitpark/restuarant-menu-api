/*
  Warnings:

  - A unique constraint covering the columns `[category_name,restaurant_id]` on the table `category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "category_category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "category_category_name_restaurant_id_key" ON "category"("category_name", "restaurant_id");
