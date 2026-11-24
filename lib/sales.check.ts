// Self-check for the sale maths. Run: npx tsx lib/sales.check.ts
import assert from "node:assert/strict";
import { applySale, saleKeys, salePrice, type SaleRule } from "./sales";

assert.equal(applySale(260, { type: "PERCENT", value: 20 }), 208);
assert.equal(applySale(255, { type: "PERCENT", value: 10 }), 229); // 25.5 rounds to 26 off
assert.equal(applySale(100, { type: "FLAT", value: 150 }), 0);     // never negative

const sales: SaleRule[] = [
  { target: "family:floral", type: "PERCENT", value: 10 },
  { target: "product:1", type: "FLAT", value: 50 },
  { target: "type:oil", type: "PERCENT", value: 30 },
];
const quietBloom = saleKeys.perfume(1, " Floral ");
assert.equal(salePrice(260, quietBloom, sales), 210);              // best of 10% (234) and ৳50 (210); no stacking
assert.equal(salePrice(300, saleKeys.perfume(2, "Woods"), sales), 300); // no match
assert.equal(salePrice(350, saleKeys.oil("oil-0"), sales), 245);
assert.equal(salePrice(1490, saleKeys.gift("gift-trio"), sales), 1490);
console.log("sales: all checks passed");
