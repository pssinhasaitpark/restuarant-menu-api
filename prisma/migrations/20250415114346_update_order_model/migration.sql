/*
  Warnings:

  - A unique constraint covering the columns `[token_number]` on the table `order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "order_token_number_key" ON "order"("token_number");
