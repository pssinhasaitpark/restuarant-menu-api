-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "is_famous_item" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_today_special" BOOLEAN NOT NULL DEFAULT false;
