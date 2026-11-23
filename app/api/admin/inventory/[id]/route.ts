import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeInventory } from "@/lib/server/inventory";

const patch = z.object({
  stockDelta: z.number().int().min(-1_000_000).max(1_000_000).optional(), // atomic +/- in ml (decants, oils) or pieces
  stockSet: z.number().int().min(0).max(1_000_000).optional(),          // set the exact amount
  enabled: z.boolean().optional(),
  visible: z.boolean().optional(),
  removed: z.boolean().optional(),
});

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("inventory");
  const { id } = await params;
  const { stockDelta, stockSet, ...flags } = await body(req, patch);
  const item = await db.$transaction(async (tx) => {
    const cur = await tx.inventoryItem.findUnique({ where: { id } });
    if (!cur) throw new HttpError(404, "Inventory record not found.");
    return tx.inventoryItem.update({
      where: { id },
      data: { ...flags, ...(stockSet !== undefined ? { stock: stockSet } : stockDelta ? { stock: Math.max(0, cur.stock + stockDelta) } : {}) },
    });
  });
  return ok(serializeInventory(item));
});
