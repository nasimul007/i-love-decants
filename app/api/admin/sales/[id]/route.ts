import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

/** Switch a sale on or off. */
export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("coupons");
  const { active } = await body(req, z.object({ active: z.boolean() }));
  const res = await db.sale.updateMany({ where: { id: Number((await params).id) }, data: { active } });
  if (!res.count) throw new HttpError(404, "Sale not found.");
  return ok({ active });
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("coupons");
  await db.sale.deleteMany({ where: { id: Number((await params).id) } });
  return ok({});
});
