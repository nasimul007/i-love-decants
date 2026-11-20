-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "bulkDiscount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SiteNotice" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "text" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SiteNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "CouponRedemption_orderId_idx" ON "CouponRedemption"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_code_phone_key" ON "CouponRedemption"("code", "phone");

-- Seed: the eight scent families become categories (plus any other family already used by a product); notice row.
INSERT INTO "Category" ("name", "sort") VALUES
  ('Floral', 1), ('Fresh', 2), ('Woody', 3), ('Gourmand', 4), ('Aromatic', 5), ('Warm', 6), ('Citrus', 7), ('Musky', 8)
ON CONFLICT ("name") DO NOTHING;
INSERT INTO "Category" ("name", "sort")
  SELECT DISTINCT "family", 100 FROM "Product" ON CONFLICT ("name") DO NOTHING;
INSERT INTO "SiteNotice" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
