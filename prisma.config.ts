import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Migrations need a direct (non-pooled) connection: Neon's `-pooler` host cannot hold the advisory lock
 * `migrate deploy` takes. Set DIRECT_URL to the direct string and keep DATABASE_URL (pooled or direct) for the app.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "" },
});
