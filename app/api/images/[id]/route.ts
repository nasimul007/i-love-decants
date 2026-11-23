import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public: one product photo straight from the database. Ids never change content, so browsers/CDNs may cache forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });
  const img = await db.productImage.findUnique({ where: { id }, select: { data: true, mime: true } });
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
