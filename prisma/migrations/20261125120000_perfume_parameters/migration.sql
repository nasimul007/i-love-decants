-- Perfume parameters: brand, audience (Men/Women/Unisex), strength (EDT/EDP/...), lasting (hour range), key notes.
ALTER TABLE "Product" ADD COLUMN "brand" TEXT NOT NULL DEFAULT '',
ADD COLUMN "audience" TEXT NOT NULL DEFAULT '',
ADD COLUMN "strength" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lasting" TEXT NOT NULL DEFAULT '',
ADD COLUMN "keyNotes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- The five Level 1 families (Edwards' wheel names + Fruity). Old categories are kept; the admin moves perfumes and deletes them.
INSERT INTO "Category" ("name", "sort") VALUES ('Fresh', 0), ('Floral', 1), ('Amber', 2), ('Woods', 3), ('Fruity', 4)
ON CONFLICT ("name") DO NOTHING;
