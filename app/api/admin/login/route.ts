import { z } from "zod";
import { db } from "@/lib/db";
import { audit, DUMMY_HASH, startStaffSession, verifyPassword } from "@/lib/server/auth";
import { body, clientIp, HttpError, ok, rateLimit, route } from "@/lib/server/http";

const schema = z.object({ username: z.string().trim().max(40), password: z.string().max(200) });

export const POST = route(async (req) => {
  const { username, password } = await body(req, schema);
  rateLimit(`admin:${clientIp(req)}:${username}`, 5);
  const s = await db.staffUser.findUnique({ where: { username } });
  const good = await verifyPassword(password, s?.passwordHash ?? DUMMY_HASH);
  if (!s || !good) throw new HttpError(401, "Incorrect username or password.");
  await startStaffSession(s.id);
  const role = s.role === "OWNER" ? "owner" : "manager";
  await audit(role, s.username, "login");
  return ok({ role, name: s.name, username: s.username, permissions: role === "manager" ? s.permissions : undefined });
});
