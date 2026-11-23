import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Editable text of every perfume (description and top / heart / base notes). */
export const GET = route(async () => {
  await requireStaff("products");
  const rows = await db.product.findMany({
    select: { id: true, name: true, family: true, description: true, top: true, heart: true, base: true, images: { select: { id: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] } },
    orderBy: { id: "asc" },
  });
  return ok(rows.map(({ images, ...p }) => ({ ...p, images: images.map((i) => i.id) })));
});
