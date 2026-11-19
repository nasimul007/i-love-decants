import { audit, currentStaff, endStaffSession } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const POST = route(async () => {
  const s = await currentStaff();
  await endStaffSession();
  if (s) await audit(s.role === "OWNER" ? "owner" : "manager", s.username, "logout");
  return ok({ ok: true });
});
