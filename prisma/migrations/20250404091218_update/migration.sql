/*
  Warnings:

  - You are about to drop the column `opening_hours` on the `restaurant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "restaurantType" AS ENUM ('veg', 'non_veg');

-- AlterTable
ALTER TABLE "restaurant" DROP COLUMN "opening_hours",
ADD COLUMN     "closing_time" TEXT DEFAULT 'close time',
ADD COLUMN     "logo" TEXT NOT NULL DEFAULT 'logo url',
ADD COLUMN     "opening_time" TEXT DEFAULT 'open _time',
ADD COLUMN     "type" "restaurantType" NOT NULL DEFAULT 'veg';
