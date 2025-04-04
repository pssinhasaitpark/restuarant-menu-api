-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "qr_code_url" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'veg';
