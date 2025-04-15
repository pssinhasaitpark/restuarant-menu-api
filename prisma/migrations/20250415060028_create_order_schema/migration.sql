-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "token_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "contact_no" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurant_id" TEXT NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_menu_itemsToorder" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_menu_itemsToorder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_token_number_key" ON "order"("token_number");

-- CreateIndex
CREATE INDEX "_menu_itemsToorder_B_index" ON "_menu_itemsToorder"("B");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_menu_itemsToorder" ADD CONSTRAINT "_menu_itemsToorder_A_fkey" FOREIGN KEY ("A") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_menu_itemsToorder" ADD CONSTRAINT "_menu_itemsToorder_B_fkey" FOREIGN KEY ("B") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
