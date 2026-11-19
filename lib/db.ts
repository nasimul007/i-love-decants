import { PrismaClient } from "@prisma/client";

/** Single Prisma client (avoids exhausting connections during Next.js dev hot reloads). */
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
