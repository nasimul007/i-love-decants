import "server-only";

export const serializeCoupon = (c: { code: string; type: "PERCENT" | "FLAT"; value: number; active: boolean; expiresAt: Date | null; maxUses: number | null; uses: number }) => ({
  code: c.code, type: c.type.toLowerCase(), value: c.value, active: c.active,
  expiresAt: c.expiresAt?.toISOString() ?? null, maxUses: c.maxUses, uses: c.uses,
});

export const serializeAudit = (e: { actor: string; user: string; action: string; ts: Date }) =>
  ({ type: e.actor, user: e.user, action: e.action, ts: e.ts.toISOString() });

export const serializeManager = (m: { id: string; name: string; username: string; permissions: unknown }) => ({
  id: m.id, name: m.name, username: m.username,
  permissions: { inventory: false, products: false, customers: false, history: false, coupons: false, content: false, ...(m.permissions as object) },
});
