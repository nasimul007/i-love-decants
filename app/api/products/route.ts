import { loadCatalog } from "@/lib/server/catalog";
import { ok, route } from "@/lib/server/http";
import { productRatings } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

/** Public storefront catalogue (prices, volumes and sprays after admin settings), plus star ratings from published reviews. */
export const GET = route(async () => ok({ ...(await loadCatalog()), ratings: await productRatings() }));
