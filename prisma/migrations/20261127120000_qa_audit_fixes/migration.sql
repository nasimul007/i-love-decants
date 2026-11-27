-- QA audit fixes (26 Nov 2026).
-- F-18: customers can save their delivery city, so checkout fills it in.
ALTER TABLE "Customer" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
-- F-01: decants are sold up to 50 ml only. Bigger sizes go off sale (prices are kept, nothing is deleted).
UPDATE "VolumeSetting" SET "onSale" = false WHERE "volumeMl" > 50;
-- F-08: the FAQ matched the old range.
UPDATE "Faq" SET "answer" = replace("answer", 'from 3 ml to 100 ml', 'from 3 ml to 50 ml') WHERE "answer" LIKE '%from 3 ml to 100 ml%';
