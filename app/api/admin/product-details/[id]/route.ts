import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";

const schema = z.object({
  description: z.string().trim().min(1, "Enter a description.").max(1000),
  top: z.string().trim().min(1, "Enter the top notes.").max(120),
  heart: z.string().trim().min(1, "Enter the heart notes.").max(120),
  base: z.string().trim().min(1, "Enter the base notes.").max(120),
});

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("products");
  const id = Number((await params).id);
  const data = await body(req, schema);
  const res = await db.product.updateMany({ where: { id }, data });
  if (!res.count) throw new HttpError(404, "Perfume not found.");
  return ok({ id, ...data });
});
