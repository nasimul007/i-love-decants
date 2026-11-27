import { z } from "zod";

export const lineSchema = z.object({
  id: z.union([z.string().max(40), z.number().int()]),
  size: z.number().int().positive().max(1000).optional(),
  full: z.boolean().optional(),
  qty: z.number().int().min(1, "Quantity must be at least 1.").max(20, "Maximum 20 per item."),
});

export const permissionsSchema = z.object({
  orders: z.boolean().default(false), inventory: z.boolean(), products: z.boolean(), customers: z.boolean(), history: z.boolean(), coupons: z.boolean(), content: z.boolean().default(false),
});

