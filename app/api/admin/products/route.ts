import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Perfumes with their category and home page flag (Admin → Home page & content). */
export const GET = route(async () => {
  await requireStaff("content");
  return ok(await db.product.findMany({ select: { id: true, name: true, family: true, featured: true }, orderBy: { id: "asc" } }));
});
