import { z } from "zod";
import { db } from "@/lib/db";
import { audit, DUMMY_HASH, publicCustomer, startCustomerSession, verifyPassword } from "@/lib/server/auth";
import { body, clientIp, HttpError, ok, rateLimit, route } from "@/lib/server/http";

const schema = z.object({ email: z.string().trim().toLowerCase(), password: z.string().max(200) });

export const POST = route(async (req) => {
  const { email, password } = await body(req, schema);
  rateLimit(`login:${clientIp(req)}:${email}`);
  const c = await db.customer.findUnique({ where: { email } });
  const good = await verifyPassword(password, c?.passwordHash ?? DUMMY_HASH);
  if (!c || !good) throw new HttpError(401, "Incorrect email or password.");
  const updated = await db.customer.update({ where: { id: c.id }, data: { lastLogin: new Date() } });
  await startCustomerSession(c.id);
  await audit("customer", c.email, "login");
  return ok(publicCustomer(updated));
});
