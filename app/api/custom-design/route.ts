import { db } from "@/lib/db";
import { ok, route } from "@/lib/server/http";
import { CUSTOM_DESIGN } from "@/lib/server/images";

export const dynamic = "force-dynamic";

/** Photos of past custom designs (Custom design page gallery), in the admin's order. */
export const GET = route(async () => {
  const rows = await db.productImage.findMany({ where: { itemId: CUSTOM_DESIGN }, select: { id: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] });
  return ok({ images: rows.map((r) => r.id) });
});
