/*
  Warnings:

  - A unique constraint covering the columns `[mobile_no]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_mobile_no_key" ON "user"("mobile_no");
