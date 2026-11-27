import { z } from "zod";
import { db } from "@/lib/db";
import { audit, hashPassword, requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { validatePassword } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  password: z.string().max(200).superRefine((pw, ctx) => {
    const e = validatePassword(pw);
    if (e) ctx.addIssue({ code: "custom", message: e });
  }),
});

/** Staff sets a new password for a customer who forgot theirs (after checking it's them, e.g. on WhatsApp). Signs them out everywhere. */
export const PATCH = route(async (req, { params }: Ctx) => {
  const s = await requireStaff("customers");
  const { id } = await params;
  const { password } = await body(req, patch);
  const c = await db.customer.findUnique({ where: { id } });
  if (!c) throw new HttpError(404, "Customer not found.");
  await db.$transaction([
    db.customer.update({ where: { id }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { customerId: id } }),
  ]);
  await audit(s.role === "OWNER" ? "owner" : "manager", s.username, `reset password of ${c.email}`);
  return ok({ id });
});

/** Deletes a customer account (e.g. a test account). Their orders stay, without the account link. */
export const DELETE = route(async (_req, { params }: Ctx) => {
  const s = await requireStaff("customers");
  const { id } = await params;
  const c = await db.customer.findUnique({ where: { id } });
  if (!c) throw new HttpError(404, "Customer not found.");
  await db.customer.delete({ where: { id } }); // sessions cascade; orders keep their snapshot (customerId set to null)
  await audit(s.role === "OWNER" ? "owner" : "manager", s.username, `deleted customer ${c.email}`);
  return ok({ id });
});
