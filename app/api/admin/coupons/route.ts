import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeCoupon } from "@/lib/server/serialize";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("coupons");
  return ok((await db.coupon.findMany({ orderBy: { code: "asc" } })).map(serializeCoupon));
});

const create = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,20}$/, "Enter a valid code (letters and numbers, 2–20 chars)."),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive("Enter a positive value.").max(1_000_000),
  expiresAt: z.string().datetime().nullish(),
  maxUses: z.number().int().positive().nullish(),
  oncePerCustomer: z.boolean().default(true),
}).refine((c) => c.type !== "percent" || c.value <= 100, { message: "Percent cannot exceed 100.", path: ["value"] });

export const POST = route(async (req) => {
  await requireStaff("coupons");
  const c = await body(req, create);
  if (await db.coupon.findUnique({ where: { code: c.code } })) throw new HttpError(409, "That code already exists.");
  const row = await db.coupon.create({
    data: { code: c.code, type: c.type === "percent" ? "PERCENT" : "FLAT", value: c.value, expiresAt: c.expiresAt ? new Date(c.expiresAt) : null, maxUses: c.maxUses ?? null, oncePerCustomer: c.oncePerCustomer },
  });
  return ok(serializeCoupon(row), 201);
});
