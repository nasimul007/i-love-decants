# All changes of 27 Nov 2026 (QA audit fixes and new features)

This document lists **every change made on 27 Nov 2026**. The work was done on branch `claude/changes` and **merged into `main`** (from `main` 7728e82): 7 commits, 81 files.
The first part is a one-page summary and the deploy checklist. Each round is then described in detail with its tests, in the order it was done.

## Summary

### Storefront (what customers see)

| Area | Change |
|---|---|
| Passwords | Show/hide **eye** on every password box (sign in, create account, admin sign-in, owner setup, manager password, “set new password”). |
| Sign in | **Forgot your password?** → WhatsApp with a ready-made message. An empty sign-in says “Enter your email and password.” |
| My account | The profile saves a **City**, and checkout fills it in. No error request while signed out. |
| Sizes | Decants are sold **up to 50 ml only**. Each perfume can switch single sizes **Off** (e.g. not enough left for 50 ml); Off sizes vanish from that perfume's pop-up, bag and checkout. |
| Scent families | Exactly **five**: Fresh, Floral, Amber, Woods, Fruity (shop filters, product cards, editor). |
| Discount codes | Per code: **Once per customer** (guests by phone number, signed-in also by account) or **Signed-in, every time** (guests are asked to sign in, with a Sign in link at checkout). Max uses works (tested). Cancelling an order gives the code use back. |
| Reviews (new) | **/reviews** page:<br>• rating summary with clickable star bars<br>• source filters and sort<br>• masonry cards, “Show more” after 12<br>• **Write a review**: stars with hover, a product picker, up to 3 photos<br>• website reviews wait for approval |
| Reviews on products | **★ rating** on product, oil and gift cards. The product pop-up shows the latest 3 reviews with **See all** / **Write a review**. **Verified buyer** badge; **Reply from I Love Decants** under reviews. Facebook/Instagram/WhatsApp reviews open the original post. |
| Home page | “Loved, then re-ordered.” strip shows the reviews switched **On home page** (up to 6). The FAQ has an **Open the FAQ page** button. |
| FAQ | Separate **/faq** page (same questions as the home FAQ). |
| Custom design | Gallery of **photos of past designs** (faded side arrows, thumbnails, hover magnifier). The drawn bottle shows until photos are added. |
| Phone | App-style **menu** (icons, notes, current page highlighted, rows slide in, WhatsApp and Sign in buttons). The shop tabs wrap to two lines instead of being cut. Proper gap between **Filters** and the scent count. The reviews filters sit on one swipeable row. |
| Intro splash | About **1.5 s** instead of 4.7 s; a tap skips it. |
| Other | Branded **404 page** with its own title. **Site icon** (and /favicon.ico). “3 ml to 50 ml” text fixed on the FAQ and How we work pages. |

### Admin

| Area | Change |
|---|---|
| Managers | New **Orders** and **Reviews** permissions. The Overview hides orders and sign-in history from managers without those permissions, and the server enforces every permission (tested, 403). |
| Orders | **Delete** for cancelled orders. A status change keeps stock and coupon use correct both ways. |
| Inventory | **Delete** for archived products (with their photos, sizes and sales). “**Stock only**” label for rows not sold in the shop. The Sizes column follows stock (“3–6 ml (stock limits it)”). A “**Details missing**” note on perfumes without brand, audience or strength. **On/Off switch per size** in the perfume editor. |
| Customers | **Set new password** (for forgot-password requests; signs the customer out everywhere, logged in Login history), **Delete**, **Download CSV**. |
| Login history | **Download CSV** (the full history). |
| Discounts | Sales and code forms no longer overlap. **Who can use it** setting per code (in the form and switchable in the table). |
| Home page & content | **Custom design photos** panel. **Scent families** fixed to five (Hide/Show only). Perfume families table. |
| Reviews tab (new) | Pending / Published / Hidden filters, a **pending badge** on the tab, Publish / Hide / ☆ Home page / Edit / Delete. The editor has a product picker, rating, date, post link, **Verified buyer**, **Reply**, screenshots. |
| Overview | “Live products” counts only items really in the shop. The Shipments card says “N open orders not yet delivered”. |

### Security and SEO

- **Security headers** on every page: no framing, no MIME sniffing, a private referrer and a permissions policy.
- **Spam guards:** the review form refuses links, has a hidden bot trap and limits each visitor to 5 reviews an hour. Photos are checked by their real file type, and each permission is checked on the server.
- **CSV safety:** exports are protected against spreadsheet formulas, and open correctly in Excel with Bangla text.
- **SEO:**
  - /reviews and /faq are built on the server and listed in the sitemap
  - product star ratings are in Google's structured data on the shop page
  - no shop-wide review stars or FAQ schema, which Google doesn't support
  - 404 pages are marked not to be indexed

## For the developer: deploy checklist

1. Pull `main` and deploy as usual. `vercel-build` runs `prisma migrate deploy && next build`, which applies **four new migrations** in order:
   - `20261127120000_qa_audit_fixes`: `Customer.city`; sizes above 50 ml set off sale (prices kept); FAQ text 100 → 50 ml.
   - `20261128120000_coupon_modes_reviews`: `Coupon.oncePerCustomer` (default on, today's rule); `Review` table.
   - `20261128180000_five_scent_families`: moves perfumes and family sales into the five families and deletes the extra categories (Woody → Woods, Gourmand/Warm → Amber, Aromatic/Citrus → Fresh, Musky → Floral).
   - `20261128200000_review_upgrades`: review product link, verified, reply, writer account.
2. **No new environment variables.**
3. **Existing managers** (none on the live site today) start with Orders and Reviews switched **off**; the owner switches them on in Managers → Edit.

## For the owner after the deploy

- Fill in brand, audience, strength, lasting and key notes for each perfume. Inventory marks the ones still missing them with “Details missing”.
- Archive and then delete the junk row “ssssssssssss”, and the audit's test data (the three QA TEST products, two cancelled QA orders, the QA customer).
- Check each perfume's family (Admin → Home page & content → Perfume families). Upload Custom design photos, and add reviews from WhatsApp or Facebook.

---

# Round 1: QA audit fixes (F-01 … F-19) and password eyes

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

# Round 2: your test feedback + new features

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

## Five scent families only (27 Nov 2026)

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

## On/Off per size for each perfume (27 Nov 2026)

**Problem:** a perfume may not have enough left for a 50 ml decant (for example only 20 ml left), but its 50 ml price should not be lost.

- **Admin → Inventory → Edit (perfume) → Price per size:** each size has an **On/Off** switch.
  - **Off:** the size disappears from the shop for that perfume only (pop-up, size buttons, bag, checkout and the server's price check). Its price stays in the box, greyed and marked **Not sold**, so switching it back **On** needs no retyping.
  - **Empty price:** still means “this perfume never comes in that size” (the switch is disabled until a price is entered).
  - **All sizes Off is refused** with a message. To take a perfume out of the shop, use **Disable** in Inventory.
- **Works together with stock:** the shop also hides sizes bigger than the ml left in stock automatically. The switch is for when the owner decides to stop a size regardless.
- **No database change:** the existing `active` flag on each perfume size is used. Saving prices now stores On/Off instead of switching every priced size on.
- **Tested:**
  - Citrus Silk: switching 50 ml and 15 ml Off → the shop offers 3–9 ml only
  - re-opening the editor shows them Off with their prices kept
  - switching every size Off is refused (the editor stays open, the shop is unchanged)
  - switching back On → 3–50 ml again
  - rapid clicking: each click counts (a stale-state bug found and fixed during testing)
- **Files:**
  - `components/admin/ProductEditor.tsx`
  - `lib/server/overrides.ts`
  - `app/api/admin/catalog/route.ts`
  - `lib/api/admin.ts`
  - `types/index.ts`
  - `app/globals.css`

## Reviews: all 10 audit improvements (27 Nov 2026)

Migration `prisma/migrations/20261128200000_review_upgrades` (runs on deploy) adds to each review: the product it is about, a verified flag, the shop's reply (with its date) and the writer's account.

| # | Improvement | What it does |
|---|---|---|
| 1 | Reviews linked to products | Website form and admin editor choose the product from a list (perfumes, oils, gift sets, or “the shop in general”). Product cards, oil cards, gift cards and the product pop-up show **★ 4.8 (12)**. The pop-up has a **Reviews** section with the latest 3, **See all reviews** (`/reviews?product=…`) and **Write a review** (product already chosen). Product ratings are added to the shop page's structured data for Google (allowed for products, unlike a shop rating). |
| 2 | Verified buyer | A signed-in customer who has a **delivered** order of that product gets **✓ Verified buyer** automatically. Staff can tick it for reviews they add (e.g. from WhatsApp) when they know the person bought. |
| 3 | Shop replies | **Reply from I Love Decants** box in the admin editor, shown under the review in a rose panel. The reply date is recorded. |
| 4 | Pending count | The admin **Reviews** tab shows a badge with the number of website reviews waiting for approval. |
| 5 | Customer photos | The website form takes up to **3 photos**: previews with remove buttons, shrunk in the browser before sending. The server checks the real file type (JPG/PNG/WebP), 2 MB per photo and at most 3, and the photos are approved together with the review. |
| 6 | Filter by stars | Click a bar in the rating summary (e.g. **4 ★**) to show only those reviews. A **4 ★ only ✕** chip clears it. |
| 7 | Show more | The page shows 12 reviews first, then **Show more reviews (N more)**. |
| 8 | Dates | Shown as **27 Nov 2026** (day month year) in Dhaka time. |
| 9 | Phone toolbar | The source chips sit on one swipeable row (soft fade at the edge), with the sort beside them. |
| 10 | Star picker | Hovering the 4th star lights stars 1–4 (it used to light only the hovered star). |

**Also fixed while testing:**
- A photo-preview bug in the new form: adding a photo would have broken the earlier previews.
- With the chips on one line, the Reviews page became 505 px wide on a 375 px phone (the page zoomed out). The column can now shrink and the chips scroll. All 14 pages were re-checked at phone width: 375 px each.

**Tests:** 14 end-to-end checks pass:
- admin picker, Verified and reply
- ratings in the shop data and on the cards
- pop-up reviews and links
- Google rating data
- the product-only reviews page
- the date format
- Show more (12 → 15)
- the star filter
- the phone toolbar
- star hover
- a guest review with 2 photos arriving as Pending
- upload guards (4 photos refused, fake image refused)
- the pending badge (1 → none after Publish)
- automatic Verified buyer for a customer with a delivered order

Test data was removed afterwards.

**Files:**
- `lib/server/reviews.ts`
- `app/api/reviews/route.ts`
- `app/api/admin/reviews/*`
- `app/api/products/route.ts`
- `app/(shop)/products/page.tsx`
- `app/(shop)/reviews/page.tsx`
- `components/reviews/*` (`RatingMini`, `ProductReviews` are new)
- `components/ui/ProductCard.tsx`
- `components/layout/ProductModal.tsx`
- `components/products/ProductsView.tsx`
- `components/admin/ReviewsPanel.tsx`
- `components/admin/Dashboard.tsx`
- `hooks/useServices.ts`
- `types/index.ts`
- `app/globals.css`

## Phone swipe fixes (27 Nov 2026, on `main`)

### Admin: tables on phones

- **Problem:** admin tables were 700 px wide and scrolled sideways inside a 349 px phone panel, with the first column (the item name) pinned on a solid background. When you swiped, every other column slid **under** that pinned column and disappeared. Examples:
  - **Home page perfumes:** you could see the names but not the On/Off switch or the family.
  - **Inventory:** the Sizes column was half hidden even before swiping, and the stock and buttons slid away.
- **Fix:** on phones (≤ 680 px) **every admin table becomes a list of cards**. The item is the card title; each value sits on its own line next to its column name (Family, On the home page, Sizes, Stock, Status, Actions…), and there is no sideways scrolling at all.
  - The shared `Panel` component labels every cell with its column header, so all 14 admin tables got this at once.
  - The “Sizes on sale” table's inline 860 px width became a desktop-only class.
  - Desktop tables are unchanged.
- **Tested at 375 px:** all 14 admin tables have no sideways scroll, nothing wider than the panel, and every value labelled. A swipe moves nothing, and tapping the Home page switch turns it on and off. On desktop the tables are normal tables as before.

### Shop: swipe test on every page (375 px, real touch events)

- **What was tested:** each of the 13 pages, plus the product pop-up, bag, checkout, phone menu and filters drawer. Every screen-height was swiped left and right on the page and on every photo, the hero, the product rail, the shop tabs, the review chips and the notice bar.
- **Already fine:** no page ever slides sideways or gets wider than the phone, and the product rail scrolls under a finger.
- **Problems found:**
  - Swiping a **photo** did nothing (review photos, oil and gift cards, Custom design gallery, product pop-up gallery, full-screen viewer). Only the small ‹ › arrows worked.
  - The **hero slideshow** ignored touch completely.
  - A rightward flick on a photo could be taken by the browser as **“go back”**, leaving the page.
- **Fix:** a small `hooks/useSwipe.ts`:
  - **Where:** the photo gallery (every place above), the full-screen viewer (only while not zoomed in, so a zoomed photo still pans) and the hero.
  - **Swipe left / right:** next / previous photo or perfume.
  - **Up-down finger moves** still scroll the page, and pinch-to-zoom still works (CSS `touch-action: pan-y pinch-zoom`).
  - **Taps** still open the viewer and the perfume.
- **Tested with real touch events:**
  - review photos, Custom design and oil cards: next → back
  - vertical scroll over a photo still scrolls (235 px)
  - viewer: tap opens it, a flick changes the photo (1/3 → 2/3), zoomed in a flick doesn't change it
  - hero: Quiet Bloom → Linen Sky → Quiet Bloom, and a tap opens the pop-up
  - the product rail still scrolls (308 px)
  - a rightward flick on a photo stays on the page
  - desktop arrows unchanged
- **Files:** `components/admin/shared.tsx`, `components/admin/Panels.tsx`, `hooks/useSwipe.ts` (new), `components/products/ProductGallery.tsx`, `components/ui/Lightbox.tsx`, `components/home/HeroSwitcher.tsx`, `app/globals.css`.

## Bangla language and night mode (27 Nov 2026, branch `claude/changes`)
- **Language switch:**
  - English stays the main language. Visitors switch with **বাং / EN** in the header (desktop) or **বাংলা / English** in the phone menu.
  - The choice is remembered per visitor (cookie `ild-lang`), and pages are rendered on the server in that language, so nothing flashes.
- **What is translated:** the whole shop.
  - Every page, the header, footer, bag, product pop-up, sign-in, chat, reviews, checkout, confirmation, account, form errors, server error messages and page titles (SEO).
- **What stays as typed:**
  - The admin is English only.
  - Text the owner types (perfume names, notes, descriptions, notices, FAQ entries, reviews) shows exactly as typed.
  - Prices, phone numbers and dates use western digits (৳260, 01712345678); dates use Bangla month names.
- **Fonts:**
  - **Tiro Bangla** for headings (an elegant serif that matches the Palatino headings) and **Hind Siliguri** for text (clear at small sizes).
  - Both are loaded with the Bengali subset only, so English pages download nothing extra.
  - Bangla gets looser line-height and no letter-spacing, so the marks above and below the letters never clip.
- **How it works (for developers):**
  - The English text is the key. `lib/i18n/bn.ts` holds the Bangla (about 690 entries), and a missing entry simply shows English.
  - Server pages use `await getT()`; client components use `useT()`; `{name}` slots fill in values.
- **Night mode:**
  - The moon / sun button switches it, and the choice is remembered (cookie `ild-theme`). Until a visitor picks one, the site follows their device's light or dark setting (a small script in `app/layout.tsx` sets it before the first paint, so nothing flashes).
  - Dark colours keep the brand's rose, sage and amber hues.
  - The light colours written directly in the CSS have matching dark versions, generated at the end of `globals.css` (regenerate them if those light colours change).
  - Pale product tiles and glows are softened.
  - The admin is never affected.
- **Tested** on a local build, phone and desktop, all 15 shop pages plus 5 pop-ups:
  - Default is English + day.
  - Both switches work and survive a reload; the phone-menu buttons work.
  - Admin stays light and English.
  - No English is left in Bangla mode except owner-typed names.
  - Night-mode text contrast is 4.5:1 or better, except the decorative empty stars and the WhatsApp-green buttons, which measure the same in day mode.
- **Note:** shop pages now render per request (they read the language cookie) instead of being pre-built. That is fine for this size of shop.
- **Files:**
  - New: `lib/i18n/*`, `components/providers/PrefsProvider.tsx`.
  - Changed: `app/layout.tsx`, `app/(shop)/*`, `app/not-found.tsx`, `app/globals.css`, the shop components, `lib/format.ts`.
