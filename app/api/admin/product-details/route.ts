import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Editable details of every perfume (description, notes and parameters). */
export const GET = route(async () => {
  await requireStaff("products");
  const rows = await db.product.findMany({
    select: { id: true, name: true, badge: true, notes: true, family: true, description: true, top: true, heart: true, base: true, brand: true, audience: true, strength: true, lasting: true, keyNotes: true, images: { select: { id: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] } },
    orderBy: { id: "asc" },
  });
  return ok(rows.map(({ images, ...p }) => ({ ...p, images: images.map((i) => i.id) })));
});
