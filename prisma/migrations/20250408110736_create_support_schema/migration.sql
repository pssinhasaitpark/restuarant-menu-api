-- CreateTable
CREATE TABLE "support" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "issues" TEXT NOT NULL,

    CONSTRAINT "support_pkey" PRIMARY KEY ("id")
);
