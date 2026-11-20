import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listNotices, MAX_NOTICES } from "@/lib/server/notices";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("content");
  return ok(await listNotices());
});

const text = z.string().trim().min(1, "Enter the notice text.").max(300, "Keep a notice under 300 characters.");

export const POST = route(async (req) => {
  await requireStaff("content");
  const d = await body(req, z.object({ text, enabled: z.boolean().default(true) }));
  if ((await db.notice.count()) >= MAX_NOTICES) throw new HttpError(400, `You can keep at most ${MAX_NOTICES} notices.`);
  const max = await db.notice.aggregate({ _max: { sort: true } });
  await db.notice.create({ data: { text: d.text, enabled: d.enabled, sort: (max._max.sort ?? 0) + 1 } });
  return ok(await listNotices(), 201);
});
