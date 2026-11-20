import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeCoupon } from "@/lib/server/serialize";

type Ctx = { params: Promise<{ code: string }> };

export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("coupons");
  const { code } = await params;
  const { active } = await body(req, z.object({ active: z.boolean() }));
  const res = await db.coupon.updateMany({ where: { code }, data: { active } });
  if (!res.count) throw new HttpError(404, "Coupon not found.");
  return ok(serializeCoupon((await db.coupon.findUnique({ where: { code } }))!));
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("coupons");
  const { code } = await params;
  await db.coupon.deleteMany({ where: { code } });
  return ok({ ok: true });
});
