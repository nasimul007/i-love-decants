import { db } from "@/lib/db";
import { currentStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Current staff session plus whether first-run setup is still needed. */
export const GET = route(async () => {
  const s = await currentStaff();
  const needsSetup = (await db.staffUser.count({ where: { role: "OWNER" } })) === 0;
  const session = s
    ? { role: s.role === "OWNER" ? "owner" : "manager", name: s.name, username: s.username, permissions: s.role === "MANAGER" ? s.permissions : undefined }
    : null;
  return ok({ session, needsSetup });
});
