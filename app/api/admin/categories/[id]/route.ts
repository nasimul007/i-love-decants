import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listCategories } from "@/lib/server/categories";

type Ctx = { params: Promise<{ id: string }> };

/** Hide or show one of the five scent families. They can't be renamed, added or deleted (lib/config.ts FAMILIES). */
export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("content");
  const id = Number((await params).id);
  const { hidden } = await body(req, z.object({ hidden: z.boolean() }));
  const res = await db.category.updateMany({ where: { id }, data: { hidden } });
  if (!res.count) throw new HttpError(404, "Family not found.");
  return ok(await listCategories());
});
