import { loadCatalog } from "@/lib/server/catalog";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Public storefront catalogue (prices, volumes and sprays after admin settings). */
export const GET = route(async () => ok(await loadCatalog()));
