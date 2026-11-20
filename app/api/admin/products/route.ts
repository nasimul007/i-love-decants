import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Perfumes with their category (for assigning categories in the admin). */
export const GET = route(async () => {
  await requireStaff("content");
  return ok(await db.product.findMany({ select: { id: true, name: true, family: true }, orderBy: { id: "asc" } }));
});
