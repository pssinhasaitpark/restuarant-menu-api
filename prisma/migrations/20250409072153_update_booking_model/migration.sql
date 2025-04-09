/*
  Warnings:

  - You are about to drop the column `payement_id` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `token_number` on the `booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booking" DROP COLUMN "payement_id",
DROP COLUMN "token_number",
ADD COLUMN     "payment_id" TEXT NOT NULL DEFAULT 'null';

-- CreateTable
CREATE TABLE "_bookingTomenu_items" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_bookingTomenu_items_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_bookingTomenu_items_B_index" ON "_bookingTomenu_items"("B");

-- AddForeignKey
ALTER TABLE "_bookingTomenu_items" ADD CONSTRAINT "_bookingTomenu_items_A_fkey" FOREIGN KEY ("A") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bookingTomenu_items" ADD CONSTRAINT "_bookingTomenu_items_B_fkey" FOREIGN KEY ("B") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
