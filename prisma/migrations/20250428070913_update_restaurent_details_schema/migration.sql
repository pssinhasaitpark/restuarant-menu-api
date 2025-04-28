/*
  Warnings:

  - You are about to drop the column `logo` on the `restaurant_details` table. All the data in the column will be lost.
  - The `services_name` column on the `restaurant_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "restaurant_details" DROP COLUMN "logo",
ADD COLUMN     "terms_and_conditions" TEXT,
DROP COLUMN "services_name",
ADD COLUMN     "services_name" TEXT[];
