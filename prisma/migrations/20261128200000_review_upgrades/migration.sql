-- Reviews: link to a product, verified buyer, shop reply, writer's account.
ALTER TABLE "Review" ADD COLUMN "productId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reply" TEXT NOT NULL DEFAULT '',
ADD COLUMN "replyAt" TIMESTAMP(3),
ADD COLUMN "customerId" TEXT;
CREATE INDEX "Review_productId_status_idx" ON "Review"("productId", "status");
