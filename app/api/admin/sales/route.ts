import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const serialize = (s: { id: number; target: string; type: "PERCENT" | "FLAT"; value: number; active: boolean; endsAt: Date | null }) =>
  ({ id: s.id, target: s.target, type: s.type.toLowerCase() as "percent" | "flat", value: s.value, active: s.active, endsAt: s.endsAt?.toISOString() ?? null });

export const GET = route(async () => {
  await requireStaff("coupons");
  return ok((await db.sale.findMany({ orderBy: { id: "desc" } })).map(serialize));
});

const create = z.object({
  target: z.string().regex(/^(product:[\w-]{1,40}|family:.{1,40}|type:(perfume|oil|gift))$/, "Choose what the sale applies to."),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive("Enter a positive amount.").max(1_000_000),
  endsAt: z.string().datetime().nullish(),
}).refine((s) => s.type !== "percent" || s.value <= 90, { message: "A sale can be at most 90% off.", path: ["value"] });

export const POST = route(async (req) => {
  await requireStaff("coupons");
  const s = await body(req, create);
  const row = await db.sale.create({ data: { target: s.target.startsWith("family:") ? s.target.toLowerCase() : s.target, type: s.type === "percent" ? "PERCENT" : "FLAT", value: s.value, endsAt: s.endsAt ? new Date(s.endsAt) : null } });
  return ok(serialize(row), 201);
});
