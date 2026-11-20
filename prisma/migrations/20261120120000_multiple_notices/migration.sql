-- CreateTable
CREATE TABLE "Notice" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- Keep the existing single notice (if it has text) as the first message.
INSERT INTO "Notice" ("text", "enabled", "sort")
  SELECT "text", "enabled", 1 FROM "SiteNotice" WHERE btrim("text") <> '';

-- DropTable
DROP TABLE "SiteNotice";
