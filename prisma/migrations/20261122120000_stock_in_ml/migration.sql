-- Stock of perfume decants and oils is now counted in millilitres (gift sets stay in pieces).
-- Rows still holding the old untouched demo defaults (25 decant units / 40 oil units, nothing ordered) are
-- converted to the new defaults (500 ml / 240 ml). Anything the admin already edited is left alone.
UPDATE "InventoryItem" SET "stock" = 500 WHERE "kind" = 'PERFUME_DECANT' AND "stock" = 25 AND "ordered" = 0;
UPDATE "InventoryItem" SET "stock" = 240 WHERE "kind" = 'PERFUME_OIL' AND "stock" = 40 AND "ordered" = 0;
