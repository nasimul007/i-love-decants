# I Love Decants: change log (branch `feat/perfume-parameters`)

For the frontend designer and developer. This lists everything changed on this branch, why, and where.
The brief came from *Perfume Parameters for I Love Decants (Level 1 Website)*.

**Ground rules followed**
- The desktop design is unchanged. Every phone-only rule sits inside one `@media (max-width: 680px)` block at the end of `app/globals.css`.
- New UI reuses existing classes and tokens (`.notes-pyramid`, `.note-level`, `.filter-chip`, `.eyebrow` styling, `--rose-deep`, `--line`, `--muted`).
- Checked on a local copy: desktop 1280 px, phone 375 px, store + admin. `npm run typecheck` and `next build` pass.

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
- **Admin:** `components/admin/ProductDetailsPanel.tsx` puts every perfume field in one form. The family change uses the same endpoint as *Notice, categories & FAQ*, so both screens agree.
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
  - Perfume: a new `Product`. The form hides price and sizes, because a perfume is priced per size in *Perfumes & prices*. It stays hidden until it has a price and stock.
  - Oil: a new `Oil` with its price.
  - Gift set: a new `GiftSet` with its price.
  - Custom bottle: a stock record only, as before.
  - Files: `app/api/admin/inventory/route.ts` and `components/admin/Panels.tsx` (`InventoryPanel`).
- *Perfumes & prices* lists every perfume, oil and gift set from the database (`lib/server/overrides.ts` now returns `items`).
  - Perfumes added in the admin have no "Edited" tag and no "Reset", because they have no catalogue defaults.
  - The server also refuses a reset for them, so a reset can't wipe their prices.
- Verified end to end: add, price, show in the shop and add to the bag.

## 3. Store ↔ admin consistency fixes
- **Admin tab:** renamed "Prices & sprays" to **"Perfumes & prices"**, with perfume details shown first and prices below.
- **Discount names:** the same everywhere: "Large-order discount (10%)" and "Discount code (CODE)". Before, it was "Bulk discount", "Coupon", "Discount" or "10% off orders of…" depending on the screen.
- **Delivery charges and large-order threshold:** read from `lib/config.ts` on the checkout and delivery pages. They were typed by hand and could drift.
- **Sizes on the home page and "How decants work":** follow the admin's sizes (`<VolumeList/>`). They were hard-coded as "3 ml to 100 ml" and "3, 6, 9, 15 + 50 and 100 ml full bottles".
- **Developer/demo text removed from what customers see:**
  - Bag: "This static frontend keeps your bag on this device."
  - Contact FAQ: "This downloadable version is a frontend demo…", now replaced by a real payment answer.
  - "Full bottles" claims on the home page and in the Contact FAQ. Full bottles are retired in the code.
- **Instagram:** the icon pointed to `instagram.com/yourusername`. It is hidden until a real link is set in `lib/config.ts`.
- **Checkout:** the coupon box no longer shows a working code (`WELCOME10`) as its example to everyone.
- **Category editor:** the hint said "e.g. Oriental", which the brief says is the outdated name. It now says "e.g. Woods".
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
- **Bag drawer** now shows the large-order discount, or how much more is needed to get it, plus the delivery cost and "Pay cash on delivery, no advance payment" before checkout.
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
- **Wide tables** (prices, inventory, orders…) scroll sideways with the first column (item name) pinned.
- **Perfume details table** (`.admin-table--stack`) stacks into cards, so its edit form fits the screen with no sideways scrolling.

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

## 8. Code clean-up (no visual change)
- **Unused CSS removed:** about 28 rules for elements that no longer exist (old profile panel, old switches, unused modals). The page fade-in keyframes are kept, since they are in use.
- **Dead code removed:**
  - Leftover Full-bottle editing code in the price panel.
  - Unused helpers in `lib/services/catalogOverrides.ts`, including `currentLinePrice`, which priced carts from the demo file.
  - Unused imports.

## 9. For the client / still open
- **Fill in the parameters:** fill in Brand, Strength, Audience and Lasting for each perfume (*Admin → Perfumes & prices*).
- **Merge old categories:** move perfumes from the old categories (Woody, Warm, Gourmand, Aromatic, Citrus, Musky) into the five families, then delete the old ones (*Notice, categories & FAQ*).
- **Sizes:** the brief lists 3/6/9/15/30/50 ml. The live site uses 3–100 ml, so change it in *Perfumes & prices → Volume sections*.
- **Engraving copy:** it still says 50 and 100 ml bottles. Keep a 100 ml size or update the copy.
- **Full-bottle returns policy:** *Delivery & Returns* still has a "Full bottles" returns row. Keep it or remove it, depending on the business.
- **Trust details (brief §6):** state where decants come from (sealed bottles from authorised sellers) and show batch codes. This needs the client's real facts before it's added.
- **Deploy:** the database migration runs automatically with `vercel-build` (`prisma migrate deploy`).
