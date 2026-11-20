import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listCategories } from "@/lib/server/categories";

type Ctx = { params: Promise<{ id: string }> };
const patch = z.object({ name: z.string().trim().min(1, "Enter a category name.").max(40).optional(), hidden: z.boolean().optional() });

/** Rename and/or hide/show. Renaming also renames the category on its perfumes. */
export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("content");
  const id = Number((await params).id);
  const d = await body(req, patch);
  await db.$transaction(async (tx) => {
    const cur = await tx.category.findUnique({ where: { id } });
    if (!cur) throw new HttpError(404, "Category not found.");
    if (d.name && d.name !== cur.name) {
      const clash = await tx.category.findFirst({ where: { name: { equals: d.name, mode: "insensitive" }, NOT: { id } } });
      if (clash) throw new HttpError(409, "That category already exists.");
      await tx.product.updateMany({ where: { family: cur.name }, data: { family: d.name } });
    }
    await tx.category.update({ where: { id }, data: { ...(d.name ? { name: d.name } : {}), ...(d.hidden !== undefined ? { hidden: d.hidden } : {}) } });
  });
  return ok(await listCategories());
});

/** A category that still has perfumes can't be deleted (move them first, or hide it instead). */
export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("content");
  const id = Number((await params).id);
  const cur = await db.category.findUnique({ where: { id } });
  if (!cur) throw new HttpError(404, "Category not found.");
  const used = await db.product.count({ where: { family: cur.name } });
  if (used) throw new HttpError(409, `${used} perfume${used === 1 ? "" : "s"} still use “${cur.name}”. Move them to another category first, or hide the category instead.`);
  await db.category.delete({ where: { id } });
  return ok(await listCategories());
});
