import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";
import { listCategories } from "@/lib/server/categories";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("content");
  return ok(await listCategories());
});

// No POST: the five scent families (lib/config.ts FAMILIES) are fixed. Staff can only hide or show them.
