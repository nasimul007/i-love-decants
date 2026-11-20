import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("content");
  const n = await db.siteNotice.findUnique({ where: { id: 1 } });
  return ok({ enabled: n?.enabled ?? false, text: n?.text ?? "" });
});

const schema = z.object({ enabled: z.boolean(), text: z.string().trim().max(300, "Keep the notice under 300 characters.") });

export const PUT = route(async (req) => {
  await requireStaff("content");
  const d = await body(req, schema);
  const n = await db.siteNotice.upsert({ where: { id: 1 }, update: d, create: { id: 1, ...d } });
  return ok({ enabled: n.enabled, text: n.text });
});
