-- Scent families are fixed to five: Fresh, Floral, Amber, Woods, Fruity (lib/config.ts FAMILIES).
-- Old families move to their Level 1 family (same as the built-in catalogue, lib/data/catalog.ts).
CREATE TEMP TABLE family_map (old TEXT PRIMARY KEY, new TEXT NOT NULL);
INSERT INTO family_map VALUES
  ('woody', 'Woods'), ('woods', 'Woods'),
  ('gourmand', 'Amber'), ('warm', 'Amber'), ('amber', 'Amber'),
  ('aromatic', 'Fresh'), ('citrus', 'Fresh'), ('fresh', 'Fresh'),
  ('musky', 'Floral'), ('floral', 'Floral'),
  ('fruity', 'Fruity');

-- Perfumes (also fixes spelling/case, e.g. "woody" → "Woods")
UPDATE "Product" p SET "family" = m.new FROM family_map m WHERE lower(trim(p."family")) = m.old;

-- Sales on a family follow it (two old families can become one sale target; the best sale still wins)
UPDATE "Sale" s SET "target" = 'family:' || lower(m.new) FROM family_map m WHERE s."target" = 'family:' || m.old;

-- Keep exactly the five categories, in this order (hidden flags of the five are kept)
INSERT INTO "Category" ("name", "sort") VALUES ('Fresh', 0), ('Floral', 1), ('Amber', 2), ('Woods', 3), ('Fruity', 4)
ON CONFLICT ("name") DO NOTHING;
DELETE FROM "Category" WHERE "name" NOT IN ('Fresh', 'Floral', 'Amber', 'Woods', 'Fruity');
UPDATE "Category" SET "sort" = CASE "name" WHEN 'Fresh' THEN 0 WHEN 'Floral' THEN 1 WHEN 'Amber' THEN 2 WHEN 'Woods' THEN 3 ELSE 4 END;

DROP TABLE family_map;
