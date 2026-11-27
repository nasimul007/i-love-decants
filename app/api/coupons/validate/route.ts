import { z } from "zod";
import { db } from "@/lib/db";
import { couponDiscount, loadCatalog, priceLine } from "@/lib/server/catalog";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { bulkDiscountFor } from "@/lib/config";
import { normalizePhone } from "@/lib/validators";
import { lineSchema } from "@/lib/server/schemas";
import { assertCouponAllowed } from "@/lib/server/coupons";
import { currentCustomer } from "@/lib/server/auth";

const schema = z.object({ code: z.string().trim().toUpperCase().max(30), items: z.array(lineSchema).min(1).max(50), phone: z.string().trim().max(20).optional() });

export const POST = route(async (req) => {
  const { code, items, phone } = await body(req, schema);
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.active || (c.expiresAt && c.expiresAt < now) || (c.maxUses !== null && c.uses >= c.maxUses)) {
    throw new HttpError(404, "Code not recognised or no longer valid.");
  }
  await assertCouponAllowed(db, c, { phone: phone ? normalizePhone(phone) : undefined, customerId: (await currentCustomer())?.id });
  const cat = await loadCatalog();
  const subtotal = items.reduce((s, l) => s + (priceLine(cat, l)?.unitPrice ?? 0) * l.qty, 0);
  return ok({ code: c.code, type: c.type.toLowerCase(), value: c.value, oncePerCustomer: c.oncePerCustomer, discount: couponDiscount(c, subtotal - bulkDiscountFor(subtotal)) });
});
