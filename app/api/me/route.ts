import { z } from "zod";
import { db } from "@/lib/db";
import { currentCustomer, publicCustomer, requireCustomer } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";
import { isBdPhone, isPersonName, NAME_ERROR } from "@/lib/validators";
import { isBdCity } from "@/lib/data/cities";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const c = await currentCustomer();
  return ok(c ? publicCustomer(c) : null);
});

const patch = z.object({
  name: z.string().trim().max(100).refine((n) => !n || isPersonName(n), NAME_ERROR),
  phone: z.string().trim().refine((p) => !p || isBdPhone(p), "Enter a valid Bangladeshi phone number."),
  address: z.string().trim().max(500),
  city: z.string().trim().max(60).refine((c) => !c || isBdCity(c), "Choose a city from the list.").default(""),
});

export const PATCH = route(async (req) => {
  const c = await requireCustomer();
  const input = await body(req, patch);
  const updated = await db.customer.update({
    where: { id: c.id }, data: { name: input.name || c.name, phone: input.phone, address: input.address, city: input.city },
  });
  return ok(publicCustomer(updated));
});
