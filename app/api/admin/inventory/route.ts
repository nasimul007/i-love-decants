import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";
import { KIND_FROM_LABEL, serializeInventory } from "@/lib/server/inventory";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("inventory");
  const items = await db.inventoryItem.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] });
  return ok(items.map(serializeInventory));
});

const create = z.object({
  name: z.string().trim().min(1).max(62),
  type: z.enum(["Perfume decant", "Perfume oil", "Gift set", "Custom bottle"]),
  sizes: z.string().trim().max(60).default("3–100 ml"),
  price: z.number().int().min(0).max(1_000_000),
  stock: z.number().int().min(0).max(9999),
});

export const POST = route(async (req) => {
  await requireStaff("inventory");
  const i = await body(req, create);
  const item = await db.inventoryItem.create({ data: { name: i.name, kind: KIND_FROM_LABEL[i.type], sizes: i.sizes || "3–100 ml", price: i.price, stock: i.stock } });
  return ok(serializeInventory(item), 201);
});
