-- Admin-chosen home page perfumes. Keeps today's hero (perfumes 1, 3, 5, 7) until the admin changes it.
ALTER TABLE "Product" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Product" SET "featured" = true WHERE "id" IN (1, 3, 5, 7);
