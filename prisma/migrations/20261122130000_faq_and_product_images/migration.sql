-- CreateTable
CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_productId_sort_idx" ON "ProductImage"("productId", "sort");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Starter questions (the admin can edit, reorder, hide or delete them in Admin → Notice & categories → FAQ)
INSERT INTO "Faq" ("question", "answer", "sort") VALUES
('What is a perfume decant?', 'A decant is a small, carefully filled portion of an original perfume in a travel-friendly bottle. You get the real fragrance in the amount you need, from 3 ml to 100 ml, at a much lower price than a full bottle.', 1),
('Are your perfumes authentic?', 'Yes. Every decant is filled from an original, sealed bottle and labelled with the perfume name and volume.', 2),
('How much does delivery cost and how long does it take?', 'Delivery is ৳80 inside Dhaka city and ৳130 outside Dhaka. We confirm your order by phone first and then dispatch it.', 3),
('How can I pay?', 'Cash on delivery: pay the rider in cash when your order arrives.', 4),
('Do you offer discounts?', 'Orders of ৳5,000 or more get 10% off automatically, and discount codes can be applied at checkout (one use per phone number).', 5);
