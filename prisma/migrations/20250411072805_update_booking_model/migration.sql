/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[razorpay_order_id]` on the table `booking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropTable
DROP TABLE "user";

-- CreateIndex
CREATE UNIQUE INDEX "booking_razorpay_order_id_key" ON "booking"("razorpay_order_id");
