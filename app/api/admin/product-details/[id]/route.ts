import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { AUDIENCES, LASTING, STRENGTHS } from "@/lib/config";
import { body, HttpError, ok, route } from "@/lib/server/http";

// "" = not set: unknown notes and untested lasting stay blank rather than guessed.
const pick = (list: readonly string[]) => z.enum(["", ...list] as [string, ...string[]]);
const schema = z.object({
  name: z.string().trim().min(1, "Enter the perfume name.").max(80),
  badge: z.string().trim().max(30),
  notes: z.string().trim().max(120),
  description: z.string().trim().min(1, "Enter a description.").max(1000),
  top: z.string().trim().max(120),
  heart: z.string().trim().max(120),
  base: z.string().trim().max(120),
  brand: z.string().trim().max(60),
  audience: pick(AUDIENCES),
  strength: pick(STRENGTHS),
  lasting: pick(LASTING),
  keyNotes: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(12).transform((a) => [...new Set(a)]),
});

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("products");
  const id = Number((await params).id);
  const data = await body(req, schema);
  const res = await db.$transaction(async (tx) => {
    const r = await tx.product.updateMany({ where: { id }, data });
    await tx.inventoryItem.updateMany({ where: { productId: id }, data: { name: data.name } }); // Inventory shows the same name
    return r;
  });
  if (!res.count) throw new HttpError(404, "Perfume not found.");
  return ok({ id, ...data });
});
