# QA audit fixes: branch `claude/changes`

These are the fixes for the problems found in the live-site audit (*I-Love-Decants-QA-Audit-Report.docx*, 26 Nov 2026). The branch also adds a show/hide eye to every password box.

- **Branch:** `claude/changes`, cut from `main` at 7728e82. It is **not merged** into `main`.
- **Status:** all developer findings are fixed and tested on a local copy. Three items are shop data that only the owner can fill in; see "Left for the owner".

---

## 1. Database migration (runs by itself on deploy)

The migration is `prisma/migrations/20261127120000_qa_audit_fixes`. It runs during `vercel-build` (`prisma migrate deploy`).

| Change | Why |
|---|---|
| New column `Customer.city` (default empty) | F-18: the profile can save a city, so checkout fills it in |
| Sizes above 50 ml are set **off sale** (prices are kept, nothing is deleted) | F-01: decants are sold up to 50 ml only |
| FAQ text “from 3 ml to 100 ml” becomes “from 3 ml to 50 ml” | F-08 |

---

## 2. Fixes, finding by finding

| # | Problem (from the audit) | What changed now | Main files |
|---|---|---|---|
| F-01 | 100 ml still on sale | The admin can't add a decant size above 50 ml; the error says “Decants go up to 50 ml”. The migration takes existing sizes above 50 ml off sale. The shop and its size filter show 3–50 ml only. | `lib/server/overrides.ts`, migration |
| F-02 | Perfume details empty | Inventory now shows **“Details missing: brand, audience or strength”** under every perfume that still needs them, so the owner can see what to fill in. | `components/admin/Panels.tsx` |
| F-03 | Junk row “ssssssssssss” counted as Live | Rows not linked to the shop say **“Stock only”**, not “Live”. Overview counts only products that are really in the shop. The junk row can now be archived and then **deleted**. | `app/api/admin/overview/route.ts`, `Panels.tsx` |
| F-04 | Cancelling an order kept the coupon used | On **cancel**, the code's use count goes down and the customer's one-time use is freed. On **re-open**, both are taken again. | `app/api/orders/[id]/route.ts` |
| F-05 | No “Forgot password” | Sign-in shows **“Forgot your password? Message us on WhatsApp”** with a ready-made message. In **Admin → Customers → Set new password**, staff set a new password once they have confirmed the person on WhatsApp. The customer is signed out everywhere, and the reset is written to Login history. | `components/layout/AuthModal.tsx`, `app/api/admin/customers/[id]/route.ts`, `Panels.tsx` |
| F-06 | Test or mistaken data couldn't be deleted | **Products:** archive, then **Delete**. This removes the product with its photos, sizes and sales, and past orders keep their own copy. **Orders:** **Delete** appears on cancelled orders only. **Customers:** **Delete** removes the account; their orders stay. | `app/api/admin/inventory/[id]/route.ts`, `app/api/orders/[id]/route.ts`, `app/api/admin/customers/[id]/route.ts`, `OrdersPanel.tsx`, `Panels.tsx` |
| F-07 | Missing security headers | Every page and API now sends `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy`. Other sites can't load the admin inside a frame. | `next.config.mjs` |
| F-08 | FAQ said 100 ml | Corrected by the migration. | migration |
| F-09 | “7 unit(s) in transit” was misleading | The Shipments card now says **“N open orders not yet delivered”**. | `overview/route.ts`, `Panels.tsx` |
| F-10 | Hint named a tab that no longer exists | It now reads “To add or remove a size, use Inventory → Sizes on sale.” Old comments were updated too. | `ProductEditor.tsx`, `lib/config.ts` |
| F-11 | The Sizes column ignored stock | It shows what the shop can sell right now, e.g. **“3–6 ml (stock limits it)”** when 8 ml is left. | `app/api/admin/inventory/route.ts` |
| F-12 | An empty sign-in said “Incorrect email or password” | It now says “Enter your email and password.” without contacting the server. | `AuthModal.tsx` |
| F-13 | The 404 page had the home page title | New branded 404 page with the normal header and footer, the title “Page not found — I Love Decants”, and **Browse perfumes / Back to home** buttons. Search engines don't index it. | `app/not-found.tsx` |
| F-14 | favicon.ico returned 404 | Added a site icon (the rose “i” badge from the admin), and `/favicon.ico` redirects to it. | `app/icon.svg`, `next.config.mjs` |
| F-15 | My account logged a 401 error for guests | Orders are only requested once a customer is signed in. | `lib/api/client.ts`, `hooks/useServices.ts`, `AccountView.tsx` |
| F-16 | “Gift Sets” tab cut off on phones | On screens up to 480 px wide, the three tabs share the width and all fit. | `app/globals.css` |
| F-17 | “1 perfume still use …” | Now “1 perfume still uses …”. Deleting a category that still has perfumes stays blocked. | `app/api/admin/categories/[id]/route.ts` |
| F-18 | City not saved in the profile | My account → Profile has a **City** picker (the same list as checkout). Checkout fills it in, and the delivery charge follows. | `AccountView.tsx`, `CheckoutView.tsx`, `app/api/me/route.ts`, migration |
| F-19 | Managers always saw all orders | New **Orders** permission (Allow/Deny) in the manager form and table. A manager without it doesn't see the Orders tab or recent orders, and the server refuses them (403). The Overview also hides “Recent sign-ins” from managers without the Login history permission. | `lib/services/admin.ts`, `Dashboard.tsx`, `Panels.tsx`, `app/api/orders/*`, `lib/server/schemas.ts`, `types/index.ts` |

**Existing managers:** they start with Orders = **Deny**. The owner switches it on in Managers → Edit. The live site has no managers yet.

---

## 3. Password show/hide eye (new)

All seven password boxes now have an eye button that shows or hides what was typed:
- customer **Sign in**
- customer **Create account**
- admin **Sign in**
- owner **first-time setup** (both boxes)
- **manager** password (add and edit)
- the new **Set new password** box for customers

The button uses the existing colours, works with the keyboard (Tab, then Enter or Space), and screen readers announce it (“Show password” / “Hide password”).
Files: `components/ui/PasswordInput.tsx` (new), `components/ui/Icons.tsx`, `app/globals.css`.

---

## 4. Tests run on this branch (local copy)

| Test | Result |
|---|---|
| Manager account: owner creates a manager (Orders + Inventory only) → manager signs in → sees only Overview / Orders / Inventory, no Edit, no sign-in history → server refuses 8 denied actions (403) → owner switches Orders off and Discounts on → manager's tabs and server access change → owner sets a new password (old one refused, new one accepted) → wrong password shows an error → owner removes the manager and the signed-in manager is cut off (401) | **13 / 13 pass** |
| Each fix above (F-01 … F-19, eye buttons), checked in the browser and through the API | **all pass** |
| Crawl of all 13 pages at desktop and phone size: no dead links, no console errors (only the intended 404), no sideways scrolling | pass |
| Shopper journeys (search, filters, sort, pop-up, bag, checkout, coupons, guest order) on desktop and phone | pass (the only failures were in the test script, re-checked by hand) |
| Earlier features (floating bag, gallery arrows, hover magnifier, hero arrows, home-page perfume switches, filter drawer, multi-photo upload, admin walk-through) | pass |
| Typecheck, production build, `lib/sales.check.ts` | pass |

---

## 5. Left for the owner (shop data, not code)

1. Fill in brand, audience, strength, lasting and key notes for each perfume. The “Details missing” note in Inventory shows which perfumes still need them.
2. Archive, then delete, the junk row “ssssssssssss”. Merge the old categories into the five families.
3. After deploying, delete the audit test data: the three archived **QA TEST** products, the two cancelled test orders and the QA customer. All of these can be deleted now.

## 6. Earlier rules, kept

- **Design:** no existing style was changed or removed. New parts use the site's own colours, buttons, fonts and page components.
- **Product pages, prices, the WhatsApp/Messenger-only custom design page, the ✦ notice framing, 11-digit phone fields and required-field stars:** unchanged.
- **Note:** some fixes had to touch server code as well as the frontend (security headers, coupon and stock rules, permissions, deleting data, the migration). Each one is listed above.

---

# Round 2 (27 Nov 2026): your test feedback + new features

Second migration: `prisma/migrations/20261128120000_coupon_modes_reviews`. It adds `Coupon.oncePerCustomer` (default **on**, today's rule) and the `Review` table. It runs by itself on deploy.

| # | Your request | What changed | Main files |
|---|---|---|---|
| 1 | “Perfume Decants” touched the tab border on phones | Phone tabs wrap long names onto two centred lines inside a taller, rounder tab. All three tabs stay equal width. | `app/globals.css` |
| 2 | “19 scents” stuck to the Filters button | Added a proper gap between the Filters button and the count. | `app/globals.css` |
| 3 | The intro splash took too long | The splash is now about **1.5 s** in total (it was 4.7 s): the brand fades in over 0.7 s, holds briefly, then fades out over 0.45 s. A tap skips it, and it still shows once per visit. Platform guidance keeps the splash exit animation under ~1 s and says never to pad it with timers. | `components/layout/Intro.tsx`, `app/globals.css` |
| 4 | The phone menu looked plain | App-style menu. Each row has an icon tile, the page name, a one-line note and a chevron. The current page is highlighted, rows slide in one after another, and quick **WhatsApp us** and **Sign in / My account** buttons sit at the bottom. The animation is off for reduced-motion users, and desktop is unchanged. | `components/layout/Header.tsx`, `components/ui/Icons.tsx`, `app/globals.css` |
| 5 | Custom design: photos of past work | **Admin → Home page & content → Custom design photos**: upload several at once, reorder, delete (up to 8). The Custom design page shows them in the same gallery as products, with faded side arrows, thumbnails, the zoom viewer and the hover magnifier. With no photos it shows the drawn bottle as before. | `components/custom/CustomEngraving.tsx`, `components/admin/ContentPanel.tsx`, `app/api/custom-design`, `lib/server/images.ts` |
| 6 | Sales form: “Applies to” spilled into “Type” | The Sales and Discount-code forms now use an even grid, so no box can overlap another at any width. | `components/admin/Panels.tsx`, `app/globals.css` |
| 7 | Discount codes: overlap, max uses, once-per-customer modes | Overlap fixed (as in 6). **Max uses tested**: with a limit of 2, the 3rd order is refused (“That discount code has been fully used.”) and checkout then rejects the code. New **“Who can use it”** setting per code, chosen when adding the code and switchable in the table: **Once per customer** (guests: one use per phone number; signed-in customers: also one per account) or **Signed-in, every time** (signed-in customers can reuse it; guests see “Sign in to use this code” with a **Sign in** link). | `lib/server/coupons.ts`, `app/api/orders/*`, `app/api/coupons/validate`, `app/api/admin/coupons/*`, `components/checkout/CheckoutView.tsx`, `Panels.tsx` |
| 8 | Facebook / Messenger link | Both already open your page (ID 61559923042243). `&sk=followers` was left off because it opens the followers list instead of the page. | — |
| 9 | Reviews | See below. | |
| 11 | CSV export | **Download CSV** buttons on **Customers** (name, email, phone, address, city, orders, joined, last login) and **Login history** (the full history, not only the latest 200). The files open correctly in Excel, Bangla text included. Cells that would run as formulas are neutralised. Each download needs the matching permission. | `lib/server/csv.ts` (+ `csv.check.ts`), `app/api/admin/customers`, `app/api/admin/history` |
| — | Found while re-checking | The How we work page still said “3 ml to 100 ml”; it now says 50 ml. | `app/(shop)/how-we-work/page.tsx` |

## Reviews (new)

- **Reviews page `/reviews`:**
  - average rating, star breakdown and number of reviews
  - filter by where the review came from (Website / WhatsApp / Facebook / Instagram), and sort by Newest or Highest rated
  - review cards in a masonry grid
  - **Write a review** form: stars, name, what they bought, text
- **Home page:** a “Loved, then re-ordered.” strip shows **only the reviews switched to “On home page”** in Admin → Reviews (up to 6, newest first), with **Read all reviews**. With none switched on there is no reviews section. *(Fixed 27 Nov: the strip used to fill empty spots with other reviews, so the switch seemed to do nothing.)* It appears once there is at least one published review. The home page stays a fast static page and is rebuilt the moment staff publish, edit, hide or delete a review (measured: about 0.1 s).
- **Links:** **Reviews** is in the header (with its own icon in the phone menu) and the footer, and `/reviews` is in the sitemap.
- **Facebook / Instagram / WhatsApp reviews:** staff add them with the customer's words, rating, date, product and a **link to the post**. Clicking anywhere on that card opens the post in a new tab. Screenshots or photos can be attached and show as a small gallery inside the card.
- **Moderation:** reviews written on the website arrive as **Pending** and appear only after **Publish**. Links in the text are refused, a hidden trap catches bots, and each visitor can send at most 5 reviews per hour.
- **Admin → Reviews:**
  - filter by All / Pending / Published / Hidden
  - Publish, Hide, ☆ Home, Edit (with photos) and Delete
  - managers need the new **Reviews** permission
- **SEO:** the page is built on the server, so search engines read every review, and it has its own title and description. There is deliberately **no review-star markup**: Google doesn't show stars for a shop's reviews of itself on its own site, and a 2026 rule targets fake or incentivised reviews.

## Round 2 tests (local copy)

- **End-to-end:** 22 checks, 20 passed first time. The other 2 were mistakes in my test script, re-checked by hand and both pass (the review date field saves; clicking a Facebook card opens the post). Covered:
  - coupon modes and max uses
  - the guest Sign in link
  - CSV downloads and permissions
  - the website review → Pending → Publish flow
  - spam guards
  - adding a Facebook review with photos, and Hide / Publish
  - filters, the Facebook card link and the photo arrows
  - phone layout
  - header, footer and sitemap links
  - managers without the permission refused (403)
  - Custom design photos with arrows and the hover zoom
- **Visual fixes after review:** a masonry layout for review cards (no holes), and shorter coupon option names (they no longer get cut off).
- **Crawl:** 26 page views (13 pages, desktop and phone): no errors, no sideways scrolling.
- **Splash measured:** it clears about 1.8 s after the page starts loading (it was about 4.7 s).

## FAQ page (27 Nov 2026)

- **New page `/faq`** with the same questions as the home page FAQ (managed in Admin → Home page & content → FAQ). It has its own title (“FAQ — I Love Decants”) and description. The first answer is open when the page loads, and below the list are **Ask on WhatsApp**, **Other ways to reach us** and **How decants work**.
- **The home page FAQ stays** as it was, plus an **Open the FAQ page** button.
- **Links:** the header **FAQ** link now opens `/faq` (highlighted in the phone menu when you're on it). FAQ is in the footer's Help column, and `/faq` is in the sitemap.
- **SEO:** the answers are built on the server, so search engines read them. There is no FAQ schema, because Google retired FAQ rich results.
- **Tested:** 5 questions on desktop and phone, the accordion opens one at a time, no sideways scrolling, no errors, every link works.
- **Files:** `app/(shop)/faq/page.tsx`, `components/home/FaqSection.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `app/sitemap.ts`, `app/globals.css`

## Five scent families only (28 Nov 2026)

The shop now has exactly **five scent families: Fresh, Floral, Amber, Woods, Fruity**.

- **Migration** `prisma/migrations/20261128180000_five_scent_families` (runs on deploy). It moves every perfume from an old family into one of the five, the same way the built-in catalogue already did:

  | Old family | New family | Perfume |
  |---|---|---|
  | Woody | Woods | Soft Oud |
  | Gourmand | Amber | Vanilla Veil |
  | Warm | Amber | Amber Light |
  | Aromatic | Fresh | Sage Rain |
  | Citrus | Fresh | Citrus Silk |
  | Musky | Floral | Moon Musk |

  Sales set on an old family move with it (e.g. a sale on Woody becomes a sale on Woods). The six extra categories are deleted, and the five keep this order.
- **Admin → Home page & content → Scent families:** shows the five with **Hide / Show** only. Adding, renaming and deleting families are gone, and the server refuses them too. The **Perfume families** table and the product editor's dropdown offer only the five.
- **Tested:**
  - shop data and filter chips show only the five
  - each chip shows exactly its perfumes
  - the server refuses add (405), rename (400) and delete (405)
  - hiding Amber hides its perfumes, and showing it brings them back
- **To change a perfume's family:** use Admin → Inventory → Edit, or the **Perfume families** table.
- **Files:**
  - `app/api/admin/categories/route.ts`
  - `app/api/admin/categories/[id]/route.ts`
  - `components/admin/ContentPanel.tsx`
  - `lib/api/admin.ts`
  - the migration
