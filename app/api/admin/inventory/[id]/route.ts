import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeInventory } from "@/lib/server/inventory";

const patch = z.object({
  stockDelta: z.number().int().min(-9999).max(9999).optional(), // atomic +/- (no lost updates)
  enabled: z.boolean().optional(),
  visible: z.boolean().optional(),
  removed: z.boolean().optional(),
});

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("inventory");
  const { id } = await params;
  const { stockDelta, ...flags } = await body(req, patch);
  const item = await db.$transaction(async (tx) => {
    const cur = await tx.inventoryItem.findUnique({ where: { id } });
    if (!cur) throw new HttpError(404, "Inventory record not found.");
    return tx.inventoryItem.update({
      where: { id },
      data: { ...flags, ...(stockDelta ? { stock: Math.max(0, cur.stock + stockDelta) } : {}) },
    });
  });
  return ok(serializeInventory(item));
});
