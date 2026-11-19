import { audit, currentCustomer, endCustomerSession } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const POST = route(async () => {
  const c = await currentCustomer();
  await endCustomerSession();
  if (c) await audit("customer", c.email, "logout");
  return ok({ ok: true });
});
