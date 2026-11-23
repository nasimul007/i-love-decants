import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/** Single Prisma client (avoids exhausting connections during Next.js dev hot reloads). */
const g = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    // Prisma's default is 5 s per interactive transaction. Saving prices or placing an order runs a few dozen queries,
    // which is slow when the database is in another region, so allow more time (a timeout shows up as a 500).
    transactionOptions: { maxWait: 15_000, timeout: 30_000 },
  });
}

export const db = g.prisma ?? create();
if (process.env.NODE_ENV !== "production") g.prisma = db;
