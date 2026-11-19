import { z } from "zod";
import { db } from "@/lib/db";
import { audit, hashPassword, startStaffSession } from "@/lib/server/auth";
import { body, clientIp, HttpError, ok, rateLimit, route } from "@/lib/server/http";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(40),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

/** First-run only: succeeds while no owner exists. */
export const POST = route(async (req) => {
  rateLimit(`setup:${clientIp(req)}`, 5);
  const input = await body(req, schema);
  const owner = await db.$transaction(async (tx) => {
    if (await tx.staffUser.count({ where: { role: "OWNER" } })) throw new HttpError(409, "Admin is already set up.");
    return tx.staffUser.create({
      data: { name: input.name, username: input.username, role: "OWNER", passwordHash: await hashPassword(input.password) },
    });
  }, { isolationLevel: "Serializable" });
  await startStaffSession(owner.id);
  await audit("owner", owner.username, "login");
  return ok({ role: "owner", name: owner.name, username: owner.username }, 201);
});
