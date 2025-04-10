-- CreateEnum
CREATE TYPE "restaurantType" AS ENUM ('veg', 'non_veg');

-- CreateTable
CREATE TABLE "restaurant" (
    "id" TEXT NOT NULL,
    "role_type" TEXT NOT NULL DEFAULT 'restaurant_admin',
    "restaurant_name" TEXT,
    "owner_name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "opening_time" TEXT,
    "closing_time" TEXT,
    "location" TEXT,
    "logo" TEXT NOT NULL DEFAULT 'logo url',
    "type" "restaurantType" NOT NULL DEFAULT 'veg',
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qr_code_url" TEXT,
    "wishlist" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table" (
    "id" UUID NOT NULL,
    "table_number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "cover_charges" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'free',
    "restaurant_id" TEXT NOT NULL,

    CONSTRAINT "table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "contact_no" TEXT NOT NULL,
    "num_of_people" INTEGER NOT NULL,
    "booking_time" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "total_charge" INTEGER NOT NULL,
    "instruction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "razorpay_order_id" TEXT NOT NULL DEFAULT 'null',
    "payment_id" TEXT NOT NULL DEFAULT 'null',
    "token_number" TEXT,
    "table_id" UUID NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_description" TEXT,
    "item_price" TEXT NOT NULL,
    "images" TEXT[],
    "category_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'veg',
    "restaurant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "employee_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "mobile_no" TEXT NOT NULL,
    "address" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL,
    "joining_date" TEXT NOT NULL,
    "other_details" TEXT,
    "profile_image" TEXT,
    "restaurant_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_bookingTomenu_items" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_bookingTomenu_items_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_email_key" ON "restaurant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "table_table_number_key" ON "table"("table_number");

-- CreateIndex
CREATE UNIQUE INDEX "category_category_name_restaurant_id_key" ON "category"("category_name", "restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "_bookingTomenu_items_B_index" ON "_bookingTomenu_items"("B");

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bookingTomenu_items" ADD CONSTRAINT "_bookingTomenu_items_A_fkey" FOREIGN KEY ("A") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bookingTomenu_items" ADD CONSTRAINT "_bookingTomenu_items_B_fkey" FOREIGN KEY ("B") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
