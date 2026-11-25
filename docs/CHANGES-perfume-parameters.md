# I Love Decants: change log and developer handoff

For the developer and the frontend designer. This lists every change made from the start of this piece of work to now: what changed, why, and where.
The brief came from *Perfume Parameters for I Love Decants (Level 1 Website)*; later sections follow the client's review rounds.

## 0. Developer handoff (read this first)

**Status**
- All work was done on branch `feat/perfume-parameters`, merged into `main` (merge commit `dd454b5`), and **pushed to GitHub `main` on 25 Nov 2026**. The branch `feat/perfume-parameters` itself was not pushed; everything is in `main`.
- Commits, oldest first: `dafc6f4` parameters + product creation + UX/SEO → `c1b365f` Inventory as product hub, notice bar, coupon limits → `8b8bf0e` "Perfumes & prices" merged into Inventory → `0d5389c` sales on products/categories → `80dfe94` change log → `dd454b5` merge.
- **Deploy not confirmed.** GitHub shows no deploy check on these commits (nor on earlier ones), so the push may not have triggered a deploy. Please check the hosting (Vercel) project, and deploy `main` if it didn't build by itself.

**Deploy steps**
1. Build command: `vercel-build` (`prisma migrate deploy && next build`), as already configured in `package.json`.
2. **Two new database migrations** run during the build. Both only **add**; nothing is dropped or rewritten:
   - `20261125120000_perfume_parameters`: adds `brand`, `audience`, `strength`, `lasting` (text, default `''`) and `keyNotes` (text array, default empty) to `Product`. It inserts the categories Fresh, Floral, Amber, Woods and Fruity only if they don't exist yet.
   - `20261125180000_product_sales`: creates the `Sale` table.
3. **Optional env var** `NEXT_PUBLIC_SITE_URL` (e.g. `https://ilovedecants.com`) sets the address used by the sitemap, robots file, canonical URLs and product structured data. Without it, Vercel's production URL is used.
4. Nothing else is needed: no new packages, and no changes to existing env vars.

**After deploying, please check** (≈10 minutes)
- **Shop:**
  - Product cards show "Choose size" and the brand/strength line when those fields are set.
  - Filters for Brand, For, Strength and Size appear once at least two values exist.
  - `/sitemap.xml` and `/robots.txt` load.
- **Admin:**
  - The tabs are Overview, Orders, Inventory, Customers, Login history, **Discounts** and Notice/categories/FAQ. "Perfumes & prices" is gone.
  - **Inventory → Edit** on a perfume opens the full form (photos, parameters, notes, colour, price per size). Save, then check the shop.
  - **Inventory → Add product → Next** shows the same form for the new item.
  - **Inventory → Sizes on sale** lists the sizes and spray counts.
  - **Discounts → Sales:** add a small sale and check the crossed-out price in the shop, then delete the sale. Try **Discount codes** with an end date or usage limit.
- **Order:** place one test order with a sale active and check that the order shows the sale price.

**Things the client still has to do in the admin** (after deploy)
- Fill in Brand, Strength, Audience and Lasting for each perfume (*Inventory → Edit*).
- Move perfumes from the old categories (Woody, Warm, Gourmand, Aromatic, Citrus, Musky) into the five families, then delete the old ones (*Notice, categories & FAQ*).
- Set the sizes on sale. The brief lists 3/6/9/15/30/50 ml; the live site uses 3–100 ml (*Inventory → Sizes on sale*).

**Known follow-ups (not done; they need a decision or more work)** — details in section 9 and 7b
- **Store settings:** delivery charges, the large-order discount and contact links are still set in `lib/config.ts`. A "Store settings" admin panel would let the client change them.
- **Product pages:** each perfume could get its own page instead of only a pop-up (SEO and sharing, Level 2).
- **Unused server operations:** `resetProductPrices`, `resetItemPrice`, `saveFullBottle` and `resetVolumes` remain in `lib/server/overrides.ts` and `app/api/admin/catalog/route.ts`, but nothing in the UI calls them any more. They can be deleted.
- **Old docs:** `HANDOFF.md` describes an older localStorage version of the app and is out of date. This file is the current reference for these changes.
- **Permissions:** a manager with only the products permission ("Edit products, prices & sizes") also needs the Inventory permission to see the Inventory tab.
- **Copy decisions:** the engraving copy (50/100 ml bottles), the "Full bottles" returns row, and the trust details from brief §6 (sealed bottles, batch codes).

**Local test data.** While building this, a local test database was used with test items ("Test Oud Royale", "Water", "Rose Petal Test", "Test Musk Oil", "Test Gift Box"), two test sales and one test order. **None of this is in the repository or the live database.**

---

**Ground rules followed**
- **Design kept:** the same colours, type, shapes and components. The only new colour is the discount colour (section 4).
- **Desktop:** layout fixes only, listed in 7b. Phone-only rules sit inside `@media (max-width: 680px)` blocks in `app/globals.css`.
- **Reuse:** new UI reuses existing classes and tokens (`.notes-pyramid`, `.note-level`, `.filter-chip`, `.eyebrow` styling, `--rose-deep`, `--line`, `--muted`).
- **Tested:** on a local copy at desktop 1280, 1440 and 1920 px and phone 375 px, store and admin, in the built-in browser and in Chrome. `npm run typecheck`, `next build` (also run on the merged `main`) and `npx tsx lib/sales.check.ts` pass.
- **How to read this:** sections 1–7 are the first round, and 7b–7e are later client review rounds. Where a later round replaced something, the earlier text says so. **Appendix A lists every changed file.**

---

## 1. Perfume parameters (from the brief)

| Field | Type | Values | Shown to customers |
|---|---|---|---|
| Name | text | as on the original bottle | card, pop-up |
| Brand | text | free text | card (small uppercase line above the name), pop-up, filter |
| Scent family | single choice | admin categories; brief's five are Fresh, Floral, Amber, Woods, Fruity | card, pop-up, filter |
| Audience | single choice | Men, Women, Unisex | card, pop-up, filter ("For") |
| Strength | single choice | EDC, EDT, EDP, Parfum/Extrait, Attar/oil, Other | card, pop-up, filter |
| Lasting | single choice | Under 2, 2–4, 4–6, 6–8, 8–10, 10–12, 12+ hrs; blank = not tested | card ("Lasting 6–8 hrs"), pop-up + one-line disclaimer |
| Key notes | tags | free, lower-cased, de-duplicated, max 12 | pop-up chips; also searchable |
| Top / Heart / Base | text | may be blank (blank = hidden) | pop-up |
| Card badge, Card tagline | text | (existed but were not editable) | card |

Rules from the brief that the code enforces:
- **Separate fields:** strength, family, audience and format are separate, never one "type".
- **Server-checked values:** the server rejects anything outside the lists above.
- **Blanks stay blank:** empty values are hidden on the storefront and never guessed. No concentration percentages are shown.
- **Fixed lists:** the allowed values live once in `lib/config.ts` (`FAMILIES`, `AUDIENCES`, `STRENGTHS`, `LASTING`), and the admin form and the API both use them.

Files:
- **Database:**
  - `prisma/schema.prisma` gains `brand`, `audience`, `strength`, `lasting` and `keyNotes` on `Product`.
  - Migration `prisma/migrations/20261125120000_perfume_parameters/` adds the columns and adds the five families as categories. Old categories are kept.
- **API:** `app/api/admin/product-details/route.ts` and `[id]/route.ts` read and save the new fields, plus name, badge and tagline.
- **Admin:** `components/admin/ProductDetailsPanel.tsx` (now `ProductEditor.tsx`) puts every perfume field in one form. The family change uses the same endpoint as *Notice, categories & FAQ*, so both screens agree.
- **Store:**
  - `components/ui/ProductCard.tsx` adds the brand line, a facts line, and the `factsOf()` helper.
  - `components/layout/ProductModal.tsx` shows a facts grid (re-uses `.notes-pyramid`), notes only when set, and key-note chips.
  - `components/products/ProductsView.tsx` adds Brand, For, Strength and Size filters. A filter group only appears when it has 2+ values, and only families that contain perfumes are shown.
- **Search** also matches brand and key notes.

## 2. Admin can now add perfumes, oils and gift sets

**Before:**
- The price tables and the price-saving code listed only the 9 demo perfumes, 18 oils and 3 gift sets from `lib/data/catalog.ts`.
- *Inventory → Add inventory* created a stock row with no product behind it, so nothing appeared in the shop. Its modal still said "the storefront will respect" it.

**Now:**
- *Inventory → **Add product*** creates the real item and links it to stock:
  - Perfume: a new `Product`. It stays hidden from the shop until it has a price and stock. *(Round 3 added step 2: the full form, prices included, opens right after Add; see 7c.)*
  - Oil: a new `Oil` with its price.
  - Gift set: a new `GiftSet` with its price.
  - Custom bottle: a stock record only, as before.
  - Files: `app/api/admin/inventory/route.ts` and `components/admin/Panels.tsx` (`InventoryPanel`).
- Inventory's **Sizes** column fills itself in: "Not priced yet" for a new perfume, then its size range once priced. Oils show "6 ml" and gift sets "Set", matching the seeded items.
- *Perfumes & prices* lists every perfume, oil and gift set from the database (`lib/server/overrides.ts` now returns `items`). *(That tab was later merged into Inventory; see 7d.)*
  - Perfumes added in the admin have no "Edited" tag and no "Reset", because they have no catalogue defaults.
  - The server also refuses a reset for them, so a reset can't wipe their prices.
- Verified end to end: add, price, show in the shop and add to the bag.

## 3. Store ↔ admin consistency fixes
- **Admin tab:** renamed "Prices & sprays" to **"Perfumes & prices"**, with perfume details shown first and prices below. *(Later merged into Inventory and removed; see 7d.)*
- **Discount names:** the same everywhere: "Large-order discount (10%)" and "Discount code (CODE)". Before, it was "Bulk discount", "Coupon", "Discount" or "10% off orders of…" depending on the screen. Files: `CartDrawer.tsx`, `CheckoutView.tsx`, `ConfirmationView.tsx`, `AccountView.tsx`.
- **Delivery charges and large-order threshold:** read from `lib/config.ts` on the checkout and delivery pages. They were typed by hand and could drift.
- **Sizes on the home page and "How decants work":** follow the admin's sizes (`<VolumeList/>`). They were hard-coded as "3 ml to 100 ml" and "3, 6, 9, 15 + 50 and 100 ml full bottles".
- **Developer/demo text removed from what customers see:**
  - Bag: "This static frontend keeps your bag on this device."
  - Contact FAQ: "This downloadable version is a frontend demo…", now replaced by a real payment answer.
  - "Full bottles" claims on the home page and in the Contact FAQ. Full bottles are retired in the code.
- **Instagram:** the icon pointed to `instagram.com/yourusername`. It is hidden until a real link is set in `lib/config.ts`.
- **Checkout:** the coupon box no longer shows a working code (`WELCOME10`) as its example to everyone (`CheckoutView.tsx`).
- **Category editor:** the hint said "e.g. Oriental", which the brief says is the outdated name. It now says "e.g. Woods" (`ContentPanel.tsx`).
- **Demo families:** the demo catalogue now uses the brief's family names (`lib/data/catalog.ts`). This only affects fresh databases.
- **Pop-up:** an empty description is no longer shown as an empty paragraph.

## 4. Discount colour (third accent)

New tokens in `:root`:
- `--deal: #9c5418` (saffron-amber)
- `--deal-pale: #f8ead8`

**Use it only for money the customer saves and for offer notices.**
- **Why this colour:** warm gold reads as reward and value and suits Eid and festive offers. Red would clash with the rose brand colour and signal alarm. Amber is clearly different from rose (brand) and sage (calm).
- **Readability:** 5.4:1 contrast on cream and 5.7:1 with white text, which passes WCAG AA. The old discount text (sage on cream) was 2.5:1, which fails.
- **Where it's applied:**
  - Discount rows in the bag, checkout, confirmation and account.
  - The "Add ৳X more to get 10% off" nudge (`.deal-note`).
  - The applied-coupon message.
  - The notice bar background.
- **Classes:** `.is-deal` (text) and `.deal-note` (pale pill).

## 5. Conversion
- **Bag drawer** (`CartDrawer.tsx`) now shows the large-order discount, or how much more is needed to get it, plus the delivery cost and "Pay cash on delivery, no advance payment" before checkout.
- Fewer surprises at checkout, no visible free code, and demo text removed (see section 3).

## 6. SEO
- **Product data for Google:** `/products` now renders the products as Schema.org `ItemList` → `Product` + `AggregateOffer` structured data in the HTML. Before, the HTML contained no product names or prices. There is no visual change.
- **Site address:**
  - `app/robots.ts` and `app/sitemap.ts` are new.
  - `metadataBase`, canonical URLs and Open Graph basics are added in `app/layout.tsx`.
  - The address comes from `NEXT_PUBLIC_SITE_URL`, or Vercel's production URL if that isn't set.
- **Pages:** each public page has its own description. Account, checkout and order confirmation are `noindex`.
- **Still open:** products have no page of their own (they open in a pop-up), so they can't rank individually. That is a Level 2 job.

## 7. Phones (≤ 680 px only)

Store:
- **Text below ~11 px raised:** tagline, card badge, "From", size list, filter chips, notes, cart notes and form hints.
- **Bigger touch areas:**
  - Header icon buttons get a 44 px touch area with an invisible enlargement, so they look the same.
  - Footer links get a tap height of about 40 px (they were 19 px).
- **Pop-up button** reads "Add to cart". The full "Add {name} to cart" wrapped to two lines with long names. Desktop keeps the name, and the `aria-label` keeps it for screen readers.

Admin:
- **Header:** the pinned header took about 45% of the screen, so it now scrolls away on phones. The top bar is more compact and its buttons no longer wrap.
- **Wide tables** (inventory, orders, codes, sizes…) scroll sideways with the first column (item name) pinned.
- **Product edit form:** it first sat inside a table, so a `.admin-table--stack` rule made it stack into cards. Since 7c/7d it opens in a window (`.mgr-modal--wide`) that fits a 375 px phone with no sideways scrolling. The stack rule is kept for any table that needs it.

## 7b. Desktop UX pass

Audited at 1440×900. These fix layout and wording only; the colours, type, shapes and component styles are unchanged. CSS is in the "DESKTOP UX PASS" block at the end of `app/globals.css`.

| Problem found | Fix | Where |
|---|---|---|
| Drawn bottle labels cut names to one line ("QUIE…", "VANI…", "YOUR WOR…") | The label wraps to two lines before "…" is used | `.bottle-label strong` |
| Prices and buttons sat at different heights across a row of cards | The price row pins to the bottom of the card, so a row lines up | `.card-price-row` |
| The card button said "Add to cart" but only opened the size chooser, so it needed a "Choose a volume before adding" note | The button now says **"Choose size"**, the note is removed, and the button is full width | `ProductCard.tsx` (`.choose-volume-note` CSS deleted) |
| Pop-up button showed double gaps ("Add  Soft Oud  to cart") | The label is one text run inside the flex button | `ProductModal.tsx` |
| Home feature cards: text ran under the bottle and gift-box art | Text width limited beside the art (desktop, and the engraving card on phones) | `.teaser-card p` |
| Shop page: first product started ~900 px down (below the fold on a laptop) | **Compact page hero** (`compact` prop → `.page-hero--compact`), and the gap under it is tightened. Products now start at ~650 px | `PageHero.tsx`, `products/page.tsx` |
| Checkout: form started ~710 px down; the order summary scrolled away before "Confirm Order" | Compact hero, and the **summary stays in view** while you scroll (≥ 901 px) | `checkout/page.tsx`, `.order-summary-card` |
| Custom Design page promised "choose a scent and size, type your text" but had no such controls | Per the client, requests go only to WhatsApp or Messenger. The copy now says that, a **Messenger button** is added next to WhatsApp, and the WhatsApp message is pre-filled with *Scent / Bottle size / Engraving text* | `CustomEngraving.tsx`, `Icons.tsx` (`MessengerIcon`), `.cta-ms-btn` (Messenger lilac from the chat widget, darkened for contrast) |
| Hero card said "from ৳250" while cards say "From ৳240", and "Tap the bottle" appeared on desktop | "From", and "Select the bottle" (works for mouse and touch) | `HeroSwitcher.tsx` |
| Oil cards were titled by brand ("Al Rehab") while the bag and admin say "Al Rehab Roll-On" | Cards show the same name as the bag and admin | `ProductsView.tsx` |

Suggestions **not** done (they need a decision):
- The footer shows an "Admin" link to shoppers. Most stores hide it; the owner can bookmark `/admin` instead.
- Oil cards all share the same description; a short line per oil (notes or strength) would help shoppers choose.
- Each perfume could get its own page instead of only a pop-up. That's better for SEO and sharing (Level 2).

## 7c. Admin product flow, notice bar, coupons (client review round 3)

**Inventory is now the hub for products.** Before, adding a perfume in Inventory gave only Name / Type / Stock. Photos and parameters lived in another tab, and a new perfume didn't even appear there until the page was reloaded. That was a cache bug: adding a product refreshed only the Inventory list.

New flow: **Inventory → Add product → (perfume / gift set) Next → full form → Save.** The product goes to its section (perfume decants, oils, gift sets).

| Change | Where |
|---|---|
| One shared **PerfumeEditor** with photos, name, brand, family, audience, strength, lasting, description, key notes, top/heart/base, card badge/tagline and **price per size**, all saved with one button | `components/admin/ProductEditor.tsx` (`PerfumeEditor`) |
| The same editor opens from **Inventory → Edit**, from **Add product → Next** (step 2 of 2) and (until 7d removed that tab) from Perfumes & prices. One form, so the screens can't disagree | `Panels.tsx` (`InventoryPanel`), `ProductEditor.tsx` |
| **ItemEditor** for oils and gift sets: name, price, and the gift-set description (wasn't editable anywhere before) | `ProductEditor.tsx` (`ItemEditor`), new API `app/api/admin/items/[id]/route.ts` |
| Adding a product refreshes every admin list and the shop at once (fixes "I added Water but can't find it") | `lib/api/admin.ts` (`addInventory`) |
| Renaming a perfume, oil or gift set also renames its Inventory row | `product-details/[id]/route.ts`, `items/[id]/route.ts` |
| Wide modal for the full editor | `Modal wide` (`shared.tsx`), `.mgr-modal--wide` |
| Edit buttons only show for staff with the products permission ("Edit products, prices & sizes") (the server enforces the same) | `InventoryPanel` |

**Notice bar speed.** Before, it crossed a full screen in 18 s whatever the text, about 160 px/s on a laptop, which is too fast to read.
- It now moves at a fixed **45 px/s**, about 6–7 letters a second. The speed is measured from the real text width and re-measured on resize, so it's the same on every screen.
- **Tap or click pauses** it (WCAG 2.2.2), as well as hover. Reduced-motion users still see static text.
- **Star framing:** each notice is framed by a star on both sides (✦ text ✦) instead of a single trailing star, so it reads as balanced. Shown in the static reduced-motion view too (`.notice-item::before/::after` in `app/globals.css`).
- File: `components/layout/NoticeBar.tsx`.
- There is no industry-standard ticker speed. The guidance is a moderate fixed px/s speed, a way to pause, and respecting reduced motion: [W3C WCAG technique SCR36](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR36), [Framer marquee (px/s, pause on hover)](https://www.framer.com/marketplace/components/steadymarquee/).

**Discount codes.** The database and checkout already supported an expiry date and a usage limit, but the admin couldn't set or see them. The admin now has:
- **Valid until** and **Max uses** fields when adding a code.
- **Used** and **Valid until** columns in the codes table.
- Status shows Active / Off / Expired / Used up.
- Deleting a code now asks for confirmation, like every other Delete.

**Storefront wording** (audit in Chrome; no broken links found):
- **Home:** "Every perfume is available in 3–100 ml" was false, since each perfume has its own sizes. It now reads "Sizes range from 3 ml to 100 ml; each perfume shows the sizes it comes in."
- **How we work:** "…or gifting a full bottle" (full bottles aren't sold) is now "…or gifting a curated set".

## 7d. "Perfumes & prices" tab removed: Inventory is the single place (client review round 4)

Everything that tab did is now in **Inventory**:

| Was in Perfumes & prices | Now |
|---|---|
| Perfume details & photos list | **Inventory → Edit** (same full form) |
| Price per perfume per size (big grid) | **Edit → Price per size** |
| Oil / gift set prices | **Edit** on the oil or gift row |
| Size sections: add/delete a size, spray counts, customer preview | **"Sizes on sale" panel under the Inventory table** (`SizesPanel`) |
| "Reset" prices to defaults, "Restore defaults" | **Removed.** They reset to the 9 demo perfumes, and "Restore defaults" would wipe every price of admin-added perfumes and take them off the shop |

- **Staff permission:** the "products" permission still exists and is now labelled **"Edit products, prices & sizes"**. It shows the Edit buttons and the Sizes panel inside Inventory. A manager needs the Inventory permission too, to see the tab at all.
- **Code:**
  - `ProductDetailsPanel.tsx` is renamed to **`ProductEditor.tsx`** and now only holds the editors.
  - The old list, the price-grid rows and the full-bottle leftovers are deleted.
  - Unused client calls are removed (`resetProductPrices`, `setItemPrice`, `resetItemPrice`, `saveFullBottle`, `resetVolumes`). Their server operations still exist but nothing calls them.

**Check: every product detail customers see can be edited in Inventory → Edit**

| Shown on the shop | Editable? |
|---|---|
| Perfume: name, brand, scent family, audience, strength, lasting, description, key notes, top/heart/base, card badge, card tagline, photos, price per size | ✅ (already) |
| Perfume **colour** (card + pop-up background, drawn bottle) and **drawn-bottle shape** | ✅ **new.** Pick from the shop's 9 existing colour sets (Rose, Mocha, Mist, Vanilla, Sage, Lavender, Amber, Citrus, Moon grey) and 4 shapes, so new products match the design |
| Gift set: name, price, description, **card colour** | ✅ (colour is **new**: Rose / Sage / Lavender) |
| Oil: name, price | ✅ |
| Shown / hidden / archived, stock | ✅ (Inventory table) |
| Sizes on sale, spray counts | ✅ (Sizes on sale panel) |
| Scent family on cards | ✅ The card now always shows the **Scent family** field. A hidden "scent tags" list that couldn't be edited anywhere used to override it |

**Not product data, and still set in code** (`lib/config.ts`): delivery charges (৳80 / ৳130), the large-order discount (10% over ৳5,000), phone / WhatsApp / Messenger / Facebook links, and the fixed oil-card sentence. These could move into a "Store settings" admin panel later.

**Custom Design page (client request):** customers are directed only to WhatsApp or Messenger (see 7b). This is confirmed still in place.

## 7e. Sales on products and categories (client review round 5)

**Problem:** the only way to give a discount was a coupon code. There was no way to put one perfume, a scent family or a whole range on sale.

**Now: Admin → Discounts** (the "Coupons" tab, renamed) has a **Sales** panel above the discount codes:
- **Applies to:**
  - a whole range (all perfume decants, all oils, or all gift sets)
  - a scent family (e.g. all Floral perfumes)
  - one perfume, oil or gift set
- **Discount:** % off (max 90%) or ৳ off each.
- **Optional end date:** the sale stops by itself after that day.
- **Controls:** turn on/off, delete (with confirmation), and the status shows On / Off / Ended.

**How prices are worked out:**
- **Server-side:** the **server** applies sales when it builds the shop price list (`lib/server/catalog.ts`). The shop, bag, checkout, coupon checks and saved orders all use the sale price, and a customer can't bypass it.
- **No stacking:** if several sales match one price, the customer gets the **lowest price**.
- **Coupons on top:** discount codes and the large-order discount then apply to the sale total.
- **Rounding:** % sales round to whole taka, and a price never goes below ৳0.
- **Self-check:** run `npx tsx lib/sales.check.ts`.
- **Admin screens show regular prices:** the inventory "From" price and the edit form's price boxes are the regular prices; the sale is a layer on top.
- **Verified:** with a 20% Floral sale and ৳50 off oils, a test order was charged ৳216 for a ৳270 decant and ৳300 per ৳350 oil.

**What customers see** (only the discount colour `--deal`, which is reserved for savings):
- **Perfume cards:** a **−20%** badge on the photo, and "From ~~৳270~~ ৳216" with the sale price in the discount colour.
- **Pop-up:** every size shows its old price crossed out, and so does the main price.
- **Oil and gift cards:** the old price is crossed out.

**Files:**
- **Database:** `prisma/schema.prisma` (model `Sale`) and migration `20261125180000_product_sales`.
- **Pricing rule:** `lib/sales.ts` and `lib/sales.check.ts`.
- **Server pricing:** `lib/server/catalog.ts` adds `wasPrices` and `wasPrice`.
- **API:** `app/api/admin/sales/route.ts` and `app/api/admin/sales/[id]/route.ts`. They use the existing Discounts/Coupons staff permission.
- **Admin:** `components/admin/Panels.tsx` (`SalesPanel`), `Dashboard.tsx`, `lib/api/admin.ts`, `hooks/useServices.ts`.
- **Storefront:** `ProductCard.tsx`, `ProductModal.tsx`, `ProductsView.tsx`, and `lib/volumes.ts` (`regularFrom`, `saleOff`).
- **CSS:** `.was-price` and `.sale-badge`.

**Also fixed:** perfumes added in the admin with no card badge used to show an empty badge bubble. It's now hidden when empty.

## 8. Code clean-up (no visual change)
- **Unused CSS removed:** about 28 rules for elements that no longer exist (old profile panel, old switches, unused modals). The page fade-in keyframes are kept, since they are in use.
- **Dead code removed:**
  - Leftover Full-bottle editing code in the price panel.
  - Unused helpers in `lib/services/catalogOverrides.ts`, including `currentLinePrice`, which priced carts from the demo file.
  - Unused imports.

## 9. For the client / still open
- **Fill in the parameters:** fill in Brand, Strength, Audience and Lasting for each perfume (*Admin → Inventory → Edit*).
- **Merge old categories:** move perfumes from the old categories (Woody, Warm, Gourmand, Aromatic, Citrus, Musky) into the five families, then delete the old ones (*Notice, categories & FAQ*).
- **Sizes:** the brief lists 3/6/9/15/30/50 ml. The live site uses 3–100 ml, so change it in *Admin → Inventory → Sizes on sale*.
- **Engraving copy:** it still says 50 and 100 ml bottles. Keep a 100 ml size or update the copy.
- **Full-bottle returns policy:** *Delivery & Returns* still has a "Full bottles" returns row. Keep it or remove it, depending on the business.
- **Trust details (brief §6):** state where decants come from (sealed bottles from authorised sellers) and show batch codes. This needs the client's real facts before it's added.
- **Deploy:** see section 0. Both migrations run automatically with `vercel-build` (`prisma migrate deploy`).

---

## Appendix A: every file changed on this branch

Compared with the previous `main` (`5d89273`, before this work); all of it is now in `main` at `dd454b5`. A = added, M = modified, D = deleted. Section numbers point to the explanations above.

**Storefront pages** (`app/(shop)/…`)
| File | | What changed |
|---|---|---|
| `page.tsx` (home) | M | Sizes follow admin settings; no "full bottles" / "every perfume" claims (3, 7c) |
| `products/page.tsx` | M | Shop title + description, product structured data for Google, compact hero (6, 7b) |
| `checkout/page.tsx` | M | Delivery/discount numbers from settings, compact hero, `noindex` (3, 6, 7b) |
| `contact/page.tsx` | M | Demo FAQ replaced with a real payment answer; full-bottle answer corrected; description (3, 6) |
| `custom/page.tsx` | M | Page description (6) |
| `delivery-returns/page.tsx` | M | Delivery charges from settings; description (3, 6) |
| `how-decants-work/page.tsx` | M | Size list follows admin settings; description (3, 6) |
| `how-we-work/page.tsx` | M | "Full bottle" wording corrected; description (6, 7c) |
| `account/page.tsx`, `order-confirmation/page.tsx` | M | `noindex` (6) |

**App-wide**
| File | | What changed |
|---|---|---|
| `app/layout.tsx` | M | Site address, canonical URLs, Open Graph, better default description (6) |
| `app/robots.ts`, `app/sitemap.ts` | A | Robots file and sitemap (6) |
| `app/globals.css` | M | Discount colour tokens, parameter styles, phone-only block, desktop UX pass, sale styles, notice-bar pause, wide modal; ~28 dead rules removed (4, 7, 7b, 7c, 7e, 8) |

**Server / API**
| File | | What changed |
|---|---|---|
| `app/api/admin/product-details/route.ts` | M | Returns the new parameters, colours and shape (1, 7d) |
| `app/api/admin/product-details/[id]/route.ts` | M | Saves and validates parameters, name/badge/tagline, colours/shape; renames the Inventory row (1, 7c, 7d) |
| `app/api/admin/inventory/route.ts` | M | "Add product" creates the real perfume/oil/gift set and labels its sizes (2) |
| `app/api/admin/items/[id]/route.ts` | A | Edit oil/gift name, price, gift description and colour (7c, 7d) |
| `app/api/admin/sales/route.ts`, `sales/[id]/route.ts` | A | Create/list/switch/delete sales (7e) |
| `lib/server/catalog.ts` | M | Applies sales to shop prices (`wasPrices` / `wasPrice`) (7e) |
| `lib/server/overrides.ts` | M | Lists every product/oil/gift from the database; refuses resetting admin-added perfumes (2, 7d) |
| `lib/sales.ts`, `lib/sales.check.ts` | A | Sale maths and its self-check (7e) |
| `prisma/schema.prisma` | M | Perfume parameters on `Product`; new `Sale` model (1, 7e) |
| `prisma/migrations/20261125120000_perfume_parameters/` | A | Parameter columns + the five families (1) |
| `prisma/migrations/20261125180000_product_sales/` | A | `Sale` table (7e) |

**Admin UI**
| File | | What changed |
|---|---|---|
| `components/admin/ProductEditor.tsx` | A | Full perfume editor (photos, parameters, notes, card text, colour, shape, prices) and oil/gift editor (7c, 7d) |
| `components/admin/ProductDetailsPanel.tsx` | D | Replaced by `ProductEditor.tsx` when "Perfumes & prices" was removed (7d) |
| `components/admin/Panels.tsx` | M | Inventory: Add product (2 steps) + Edit; Sizes on sale panel; Sales panel; coupon expiry/limits/usage; price tables and dead code removed (2, 7c, 7d, 7e, 8) |
| `components/admin/Dashboard.tsx` | M | Tabs: "Perfumes & prices" removed, Sizes under Inventory, Sales under Discounts (7d, 7e) |
| `components/admin/ContentPanel.tsx` | M | Category hint "e.g. Woods"; unused import (3) |
| `components/admin/shared.tsx` | M | `Modal` gets a `wide` option (7c) |
| `lib/api/admin.ts` | M | New calls (product details, items, sales, coupon limits); add-product refreshes every list; unused calls removed (2, 7c, 7d, 7e) |
| `lib/services/admin.ts` | M | Tab names: "Discounts", products permission label, products no longer a tab (7d, 7e) |
| `hooks/useServices.ts` | M | `useSales`; renamed label comment (7e) |

**Storefront components**
| File | | What changed |
|---|---|---|
| `components/ui/ProductCard.tsx` | M | Brand + facts line, "Choose size" button, family from one field, empty badge hidden, sale badge + crossed-out price (1, 7b, 7d, 7e) |
| `components/layout/ProductModal.tsx` | M | Facts grid, notes only when set, key-note chips, button text fix, sale prices (1, 7, 7b, 7e) |
| `components/products/ProductsView.tsx` | M | Brand/For/Strength/Size filters, search on brand + notes, oil names, sale prices (1, 7b, 7e) |
| `components/layout/CartDrawer.tsx` | M | Large-order nudge, delivery + cash-on-delivery line, demo text removed (3, 5) |
| `components/checkout/CheckoutView.tsx` | M | Discount names and colour, no public coupon example (3, 4) |
| `components/checkout/ConfirmationView.tsx`, `components/account/AccountView.tsx` | M | Discount names and colour (3, 4) |
| `components/layout/NoticeBar.tsx` | M | 45 px/s speed, tap to pause (7c) |
| `components/layout/Footer.tsx` | M | Instagram icon hidden until a real link exists (3) |
| `components/custom/CustomEngraving.tsx` | M | WhatsApp + Messenger only, matching copy, pre-filled message (7b) |
| `components/home/HeroSwitcher.tsx` | M | "From", "Select the bottle" (7b) |
| `components/ui/PageHero.tsx` | M | `compact` option (7b) |
| `components/ui/Icons.tsx` | M | `MessengerIcon` (7b) |

**Shared logic, types and data**
| File | | What changed |
|---|---|---|
| `lib/config.ts` | M | Allowed parameter values, `SITE_URL`, Instagram placeholder removed (1, 3, 6) |
| `lib/volumes.ts` | M | `regularFrom`, `saleOff` for sale display (7e) |
| `lib/services/catalogOverrides.ts` | M | `perfumesOf` (all database perfumes); dead helpers removed (2, 8) |
| `lib/data/catalog.ts` | M | Demo families renamed to the brief's names; unused `FAMILIES` list removed (3) |
| `types/index.ts` | M | Parameter, sale, coupon-limit and item fields (1, 7c, 7e) |
| `docs/CHANGES-perfume-parameters.md` | A | This document |

Not committed (local testing only): `.env` (local database address) and the dev-server launch config.
