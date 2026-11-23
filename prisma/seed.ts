import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PRODUCTS, GIFTS, OILS } from "../lib/data/catalog";
import { DEFAULT_VOLUMES, DEFAULT_SPRAYS } from "../lib/config";
import { DEFAULT_COUPONS } from "../lib/services/coupons";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const p of PRODUCTS) {
    const { prices, fullBottle: _f, images: _img, scentFamilies, id, ...rest } = p;
    await db.product.upsert({
      where: { id },
      update: {},
      create: {
        id, ...rest, scentTags: scentFamilies ?? [],
        variants: { create: Object.entries(prices).map(([ml, price]) => ({ volumeMl: Number(ml), price })) },
        inventory: {
          create: {
            name: p.name, kind: "PERFUME_DECANT", sizes: `${DEFAULT_VOLUMES[0]}–${DEFAULT_VOLUMES.at(-1)} ml`,
            price: Math.min(...Object.values(prices)), stock: 500, // ml (perfume decants and oils are stocked in millilitres)
          },
        },
      },
    });
  }

  for (const o of OILS) {
    await db.oil.upsert({
      where: { id: o.id }, update: {},
      create: {
        id: o.id, brand: o.brand, name: o.name, price: o.price,
        inventory: { create: { name: o.name, kind: "PERFUME_OIL", sizes: "6 ml", price: o.price, stock: 240 /* ml: 40 roll-ons */ } },
      },
    });
  }

  for (const g of GIFTS) {
    await db.giftSet.upsert({
      where: { id: g.id }, update: {},
      create: {
        ...g,
        inventory: { create: { name: g.name, kind: "GIFT_SET", sizes: "Set", price: g.price, stock: 15 } },
      },
    });
  }

  for (const ml of DEFAULT_VOLUMES) {
    await db.volumeSetting.upsert({
      where: { volumeMl: ml }, update: {}, create: { volumeMl: ml, sprays: DEFAULT_SPRAYS[ml] },
    });
  }
  await db.fullBottleSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  for (const c of DEFAULT_COUPONS) {
    await db.coupon.upsert({
      where: { code: c.code }, update: {},
      create: { code: c.code, type: c.type === "percent" ? "PERCENT" : "FLAT", value: c.value, active: c.active },
    });
  }
  console.log("Seed complete.");
}

main().finally(() => db.$disconnect());
