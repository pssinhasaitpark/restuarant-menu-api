/*
  Warnings:

  - A unique constraint covering the columns `[table_number,restaurant_id]` on the table `table` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "table_table_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "table_table_number_restaurant_id_key" ON "table"("table_number", "restaurant_id");
