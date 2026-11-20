import "server-only";
import { db } from "@/lib/db";

/** Categories with how many perfumes use each (for the admin screen). */
export async function listCategories() {
  const [cats, products] = await Promise.all([
    db.category.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] }),
    db.product.findMany({ select: { family: true } }),
  ]);
  return cats.map((c) => ({
    id: c.id, name: c.name, hidden: c.hidden,
    products: products.filter((p) => p.family.toLowerCase() === c.name.toLowerCase()).length,
  }));
}
