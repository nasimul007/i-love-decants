# Backend Developer Handoff Guide

The storefront is a complete frontend. Every piece of "backend" behaviour lives in
`lib/services/*`, behind plain functions, and **only `lib/storage.ts` touches `localStorage`**.
Replacing persistence means rewriting the service functions — components do not change shape.

## 1. Layers

```
components/ , app/**/page.tsx      UI only. Never touches storage.
        │  call
hooks/useServices.ts               Reactive reads (useCart, useCatalog, useOrders …)
        │  read via useStored(key)
lib/services/*.ts                  Business rules + persistence  ← the part you replace
        │  read/write
lib/storage.ts                     localStorage / sessionStorage adapter + pub-sub
types/index.ts                     The data contract (Customer, Order, Coupon, …)
```

* **Writes** go through service methods (`cartService.add`, `orderService.place`, …). Each write calls
  `writeJSON`, which notifies subscribers, so every mounted component re-renders. No manual refresh anywhere.
* **Reads** go through `useStored` / the hooks in `hooks/useServices.ts` (built on `useSyncExternalStore`;
  server render and hydration see the empty fallback, so there are no hydration mismatches).

## 2. Storage keys → resources

| Key (`lib/storage.ts › KEYS`) | Service | Type | Becomes… |
|---|---|---|---|
| `ild-admin-inventory-v1` | `inventoryService` | `InventoryRecord[]` | `products` / `inventory` tables; `storefrontId` links to catalogue id |
| `ild-cart-v1` | `cartService` | `CartItem[]` | Keep client-side for guests; optionally `carts` table once signed in |
| `ild-customers-v1` | `customerService` | `Customer[]` | `customers` table (**hash passwords with bcrypt/argon2**) |
| `ild-customer-session-v1` | `customerService` | `{email}` | HTTP-only session cookie / JWT |
| `ild-last-order` | `orderService.last` | `Order` | Read of the order id returned by checkout (`/order-confirmation?id=…`) |
| `ild-orders-v1` | `orderService` | `Order[]` | `orders` + `order_items` tables |
| `ild-coupons-v1` | `couponService` | `Coupon[]` | `coupons` table |
| `ild-catalog-overrides-v1` | `catalogOverridesService` | `CatalogOverrides`: volumes on sale, spray count per volume, price per perfume/volume (`null` = not offered), oil & gift prices | Volumes + prices → `product_variants` rows (one per perfume/volume, `is_active=false` when not offered) via `PUT /admin/products/:id`; spray counts → **new** per-volume setting. The backend currently only accepts 3/6/9/15/50/100 ml for perfumes — relax that check (`VOLUMES` in `src/modules/pricing.ts` / product validation) before connecting. |
| `ild-admin-config-v1` | `adminService` | `AdminConfig` | `staff_users` table (role = owner/manager + permissions) |
| `ild-login-history-v1` | `loginHistoryService` | `LoginEvent[]` | `audit_log` table |
| `ild-admin-session-v1` (sessionStorage) | `adminService` | `AdminSession` | Separate staff session cookie |

Static catalogue data (`lib/data/catalog.ts`: 9 perfumes with per-volume `prices`, gift sets, 18 oils) maps to
`products`, `product_prices(product_id, volume_ml, price)`, `gift_sets`, `oils`.

## 3. Proposed REST surface (or Server Actions of the same name)

| Service method | HTTP | Notes |
|---|---|---|
| `customerService.register` | `POST /api/auth/register` | Re-validate phone (`^(?:\+?880\|0)1[3-9]\d{8}$`), email, password strength on the server |
| `customerService.login / logout` | `POST /api/auth/login`, `POST /api/auth/logout` | Set/clear session cookie; write audit event |
| `customerService.updateProfile` | `PATCH /api/me` | |
| `orderService.place` | `POST /api/orders` | **Recompute prices, coupon discount and delivery charge on the server; never trust the client totals.** Return `{ id }` (`ILD-XXXX`, unique) |
| `orderService.list / forCustomer` | `GET /api/orders` (staff) / `GET /api/me/orders` | |
| `orderService.updateStatus` | `PATCH /api/orders/:id` | Staff only |
| `couponService.find / discount` | `POST /api/coupons/validate` | Return discount for a cart; coupons themselves are staff-managed |
| `couponService.add / toggle / remove` | `POST/PATCH/DELETE /api/admin/coupons` | |
| `inventoryService.*` | `GET /api/products`, `PATCH /api/admin/inventory/:id` | Storefront reads only enabled+visible+non-archived |
| `adminService.login / setupOwner` | `POST /api/admin/login`, `POST /api/admin/setup` | `setup` must work only while no owner exists |
| `adminService.saveManager / removeManager` | `POST/PATCH/DELETE /api/admin/managers` | Owner only |
| `loginHistoryService.list` | `GET /api/admin/login-history` | |

### Admin "Prices & sprays" tab
`components/admin/Panels.tsx › PricingPanel` lets the admin add/delete volume sections (site-wide), set each volume's spray
count, set every perfume's price per volume (blank = that perfume isn't offered in it), and each oil/gift price. Customers
only see volumes that are both on sale and priced; cart lines for a removed volume are dropped.

**Full bottle section** (`CatalogOverrides.fullBottle`): a special section that can't be deleted, only switched ON/OFF,
with its own size (ml), spray count and price (per-perfume overrides in `prices[pid].full`, `null` = not offered).
While ON, a regular section with the same ml is hidden from customers (same bottle) and returns when it is switched OFF.
Cart lines carry `full: true` (key `<id>-full`). Backend: model it as a variant flagged `is_full_bottle` per product plus a
site setting `{ enabled, ml, sprays, price }`. Storefront reads go through `useCatalog()` / `useSprays()`; `useCart()` re-prices existing bag lines on
every read so checkout always uses the current price. Gated by the new manager permission `products`
(same name as the backend permission). The backend still needs a spray-count field before this tab can be fully API-backed.

## 4. How to swap a service (example: orders, Next.js Server Actions)

1. **Server action** (`app/actions/orders.ts`)
   ```ts
   "use server";
   export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
     const session = await getCustomerSession();                // optional
     const priced = await priceCart(input.items);               // server-side prices
     const discount = await validateCoupon(input.couponCode, priced.subtotal);
     return db.order.create({ data: { ...build(input, priced, discount), customerId: session?.id } });
   }
   ```
2. **Service** – make the method async and delegate:
   ```ts
   place: (input) => placeOrder(input),          // was: write to localStorage
   ```
3. **Hook** – replace `useStored(KEYS.orders, [])` with `useSWR("/api/orders", fetcher)` or a React Query hook
   and `mutate()` after writes (that replaces the `emit()` pub-sub in `storage.ts`).
4. **Call-sites** – the only changes are `await` + loading/error states, e.g. in
   `components/checkout/CheckoutView.tsx` (`submit`) and `ProductModal` (`add`).

Do the same service-by-service; each one is independent. Keep `types/index.ts` as the shared contract
(or generate it from your DB schema/OpenAPI).

## 5. Things that are intentionally demo-grade (must change in production)

* `lib/services/hash.ts` is a non-cryptographic hash. Use bcrypt/argon2 **server-side**; never hash in the browser.
* Admin permission checks (`can()` in `lib/services/admin.ts`) only hide UI. **Enforce the same permissions in
  every admin endpoint.** Manager credentials/role must be checked server-side per request.
* Payments are not processed. Bank/Wallet "providers" (`PAYMENT_ROUTES` in `lib/services/orders.ts`) and the
  transaction reference are collected for manual verification — replace with a gateway (bKash, Nagad, SSLCommerz…)
  and verify callbacks server-side.
* Cart prices are copied into `CartItem.price`; the server must re-price from the catalogue at checkout.
* Stock is decremented in `inventoryService.recordSale` but not enforced at add-to-cart; add an atomic stock
  check in the order transaction.
* Contact form (`components/contact/ContactForm.tsx`) only validates and shows a success message → POST to your
  inbox/helpdesk API. Contact channel URLs/phone live in `lib/config.ts`.
* Admin pages are `noindex`; add real auth middleware (`middleware.ts`) for `/admin` + `/api/admin/*`.

## 6. Business rules to preserve

* Delivery: Inside Dhaka ৳100, outside ৳150 (`DELIVERY_ZONES`). Grand total = `max(0, subtotal − discount) + delivery`.
* Coupons: `percent` → `round(subtotal × value / 100)`; `flat` → `min(value, subtotal)`. Defaults seeded:
  `WELCOME10`, `BLOOM20`, `FLAT100`, `FIRST15`. Codes are case-insensitive, only `active` ones apply.
* Engraving: max 24 characters, 50 ml / 100 ml bottles only.
* Order id: `ILD-` + 4 chars from `A-Z2-9` (no ambiguous characters), unique.
* Storefront visibility: an item is hidden when its inventory record has `enabled=false`, `visible=false` or `removed=true`.
