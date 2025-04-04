-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_table_id_fkey";

-- DropForeignKey
ALTER TABLE "table" DROP CONSTRAINT "table_restaurant_id_fkey";

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
