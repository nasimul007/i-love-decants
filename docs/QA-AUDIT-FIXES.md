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
