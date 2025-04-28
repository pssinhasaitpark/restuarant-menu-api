-- CreateTable
CREATE TABLE "restaurant_details" (
    "id" TEXT NOT NULL,
    "logo" TEXT NOT NULL DEFAULT 'logo url',
    "gallery_images" TEXT[],
    "about_us" TEXT,
    "privacy_policy" TEXT,
    "services_name" TEXT[],
    "restaurant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_details_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "restaurant_details" ADD CONSTRAINT "restaurant_details_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
