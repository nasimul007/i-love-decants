-- Coupons: "once per customer" (default, today's rule) or "signed-in customers, every time".
ALTER TABLE "Coupon" ADD COLUMN "oncePerCustomer" BOOLEAN NOT NULL DEFAULT true;

-- Reviews (website submissions + reviews staff add from WhatsApp / Facebook / Instagram).
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'website',
    "link" TEXT NOT NULL DEFAULT '',
    "product" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Review_status_sort_idx" ON "Review"("status", "sort");
