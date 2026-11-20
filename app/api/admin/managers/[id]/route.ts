import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireOwner } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { permissionsSchema } from "@/lib/server/schemas";
import { serializeManager } from "@/lib/server/serialize";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  name: z.string().trim().min(1, "Name and username are required.").max(100),
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(40),
  password: z.string().max(200).refine((p) => p === "" || p.length >= 8, "Password must be at least 8 characters.").default(""), // blank = keep
  permissions: permissionsSchema,
});

export const PATCH = route(async (req, { params }: Ctx) => {
  await requireOwner();
  const { id } = await params;
  const m = await body(req, patch);
  const cur = await db.staffUser.findFirst({ where: { id, role: "MANAGER" } });
  if (!cur) throw new HttpError(404, "Manager not found.");
  const clash = await db.staffUser.findFirst({ where: { username: m.username, NOT: { id } } });
  if (clash) throw new HttpError(409, "That username is already taken.");
  const row = await db.$transaction(async (tx) => {
    const updated = await tx.staffUser.update({
      where: { id },
      data: { name: m.name, username: m.username, permissions: m.permissions, ...(m.password ? { passwordHash: await hashPassword(m.password) } : {}) },
    });
    if (m.password) await tx.session.deleteMany({ where: { staffId: id } }); // password change signs them out everywhere
    return updated;
  });
  return ok(serializeManager(row));
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireOwner();
  const { id } = await params;
  await db.staffUser.deleteMany({ where: { id, role: "MANAGER" } }); // sessions cascade, so access ends immediately
  return ok({ ok: true });
});
