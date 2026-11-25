import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("content");
  const id = Number((await params).id);
  const input = await body(req, z.union([z.object({ category: z.string().trim().min(1).max(40) }), z.object({ featured: z.boolean() })]));
  if ("featured" in input) {
    const res = await db.product.updateMany({ where: { id }, data: { featured: input.featured } });
    if (!res.count) throw new HttpError(404, "Perfume not found.");
    return ok({ id, featured: input.featured });
  }
  const { category } = input;
  const cat = await db.category.findFirst({ where: { name: { equals: category, mode: "insensitive" } } });
  if (!cat) throw new HttpError(400, "Choose an existing category.");
  const res = await db.product.updateMany({ where: { id }, data: { family: cat.name } });
  if (!res.count) throw new HttpError(404, "Perfume not found.");
  return ok({ id, family: cat.name });
});
