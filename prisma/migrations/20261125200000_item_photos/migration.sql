-- Photos for perfume oils and gift sets: a photo now belongs to a perfume (productId) or an item (itemId).
ALTER TABLE "ProductImage" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "ProductImage" ADD COLUMN "itemId" TEXT;
CREATE INDEX "ProductImage_itemId_sort_idx" ON "ProductImage"("itemId", "sort");
