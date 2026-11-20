import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listCategories } from "@/lib/server/categories";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("content");
  return ok(await listCategories());
});

const create = z.object({ name: z.string().trim().min(1, "Enter a category name.").max(40) });

export const POST = route(async (req) => {
  await requireStaff("content");
  const { name } = await body(req, create);
  if (await db.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } })) throw new HttpError(409, "That category already exists.");
  const max = await db.category.aggregate({ _max: { sort: true } });
  await db.category.create({ data: { name, sort: (max._max.sort ?? 0) + 1 } });
  return ok(await listCategories(), 201);
});
