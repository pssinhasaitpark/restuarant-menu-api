/*
  Warnings:

  - You are about to drop the column `gross_slary` on the `staff_salary` table. All the data in the column will be lost.
  - Added the required column `gross_salary` to the `staff_salary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "staff_salary" DROP COLUMN "gross_slary",
ADD COLUMN     "gross_salary" DOUBLE PRECISION NOT NULL;
