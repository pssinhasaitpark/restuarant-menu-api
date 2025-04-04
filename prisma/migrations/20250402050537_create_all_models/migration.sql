-- CreateTable
CREATE TABLE "restaurant" (
    "id" TEXT NOT NULL,
    "role_type" TEXT NOT NULL DEFAULT 'restaurant_admin',
    "restaurant_name" TEXT,
    "owner_name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "opening_hours" TEXT,
    "location" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "booking_time" TIMESTAMP(3) NOT NULL,
    "total_charge" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "table_id" UUID NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_email_key" ON "restaurant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "table_table_number_key" ON "table"("table_number");

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
