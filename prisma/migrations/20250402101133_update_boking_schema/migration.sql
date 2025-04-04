-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "payement_id" TEXT NOT NULL DEFAULT 'payement123',
ADD COLUMN     "razorpay_order_id" TEXT NOT NULL DEFAULT 'order123';
