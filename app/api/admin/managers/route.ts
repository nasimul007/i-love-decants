import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireOwner } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeManager } from "@/lib/server/serialize";
import { permissionsSchema } from "@/lib/server/schemas";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireOwner();
  return ok((await db.staffUser.findMany({ where: { role: "MANAGER" }, orderBy: { createdAt: "asc" } })).map(serializeManager));
});

const create = z.object({
  name: z.string().trim().min(1, "Name and username are required.").max(100),
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(40),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  permissions: permissionsSchema,
});

export const POST = route(async (req) => {
  await requireOwner();
  const m = await body(req, create);
  if (await db.staffUser.findUnique({ where: { username: m.username } })) throw new HttpError(409, "That username is already taken.");
  const row = await db.staffUser.create({
    data: { name: m.name, username: m.username, role: "MANAGER", permissions: m.permissions, passwordHash: await hashPassword(m.password) },
  });
  return ok(serializeManager(row), 201);
});
