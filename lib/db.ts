import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/** Single Prisma client (avoids exhausting connections during Next.js dev hot reloads). */
const g = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

export const db = g.prisma ?? create();
if (process.env.NODE_ENV !== "production") g.prisma = db;
