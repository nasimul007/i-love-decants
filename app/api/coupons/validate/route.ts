import { z } from "zod";
import { db } from "@/lib/db";
import { couponDiscount, loadCatalog, priceLine } from "@/lib/server/catalog";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { bulkDiscountFor } from "@/lib/config";
import { normalizePhone } from "@/lib/validators";
import { lineSchema } from "@/lib/server/schemas";

const schema = z.object({ code: z.string().trim().toUpperCase().max(30), items: z.array(lineSchema).min(1).max(50), phone: z.string().trim().max(20).optional() });

export const POST = route(async (req) => {
  const { code, items, phone } = await body(req, schema);
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.active || (c.expiresAt && c.expiresAt < now) || (c.maxUses !== null && c.uses >= c.maxUses)) {
    throw new HttpError(404, "Code not recognised or no longer valid.");
  }
  if (phone && await db.couponRedemption.findUnique({ where: { code_phone: { code: c.code, phone: normalizePhone(phone) } } })) {
    throw new HttpError(409, "This code has already been used with this phone number.");
  }
  const cat = await loadCatalog();
  const subtotal = items.reduce((s, l) => s + (priceLine(cat, l)?.unitPrice ?? 0) * l.qty, 0);
  return ok({ code: c.code, type: c.type.toLowerCase(), value: c.value, discount: couponDiscount(c, subtotal - bulkDiscountFor(subtotal)) });
});
