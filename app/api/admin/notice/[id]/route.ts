import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listNotices } from "@/lib/server/notices";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  text: z.string().trim().min(1, "Enter the notice text.").max(300, "Keep a notice under 300 characters.").optional(),
  enabled: z.boolean().optional(),
});

export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("content");
  const id = Number((await params).id);
  const d = await body(req, patch);
  const res = await db.notice.updateMany({ where: { id }, data: d });
  if (!res.count) throw new HttpError(404, "Notice not found.");
  return ok(await listNotices());
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("content");
  await db.notice.deleteMany({ where: { id: Number((await params).id) } });
  return ok(await listNotices());
});
