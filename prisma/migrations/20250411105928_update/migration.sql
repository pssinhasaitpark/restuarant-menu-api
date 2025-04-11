-- AlterTable
ALTER TABLE "user" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expiry" TIMESTAMP(3),
ADD COLUMN     "role_type" TEXT NOT NULL DEFAULT 'user';
