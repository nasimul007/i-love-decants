# I Love Decants — Next.js (App Router, TypeScript)

Luxury decant / perfume-oil storefront with cart, checkout, customer accounts and an admin/manager
dashboard. Backend: Next.js Route Handlers (`app/api`) + PostgreSQL via Prisma. Only the guest cart and the
last-order confirmation stay in `localStorage`.

```bash
npm install
cp .env.example .env            # set DATABASE_URL (PostgreSQL)
npm run db:migrate -- --name init
npm run db:seed                 # catalogue, volumes, default coupons
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## Structure
```
app/                     Routes: / products custom contact checkout order-confirmation
                         how-we-work delivery-returns how-decants-work admin
  globals.css            Design system (tokens: --cream --rose-deep --sage, bottle art, drawers, admin)
components/
  layout/                Header(+search) Footer Intro CartDrawer ProductModal ChatWidget
                         AuthModal ProfilePanel Toast Cursor SiteShell
  ui/                    BottleVisual ProductCard PageHero Icons
  home/ products/ custom/ contact/ checkout/ admin/   Page-level client components
hooks/useServices.ts     Reactive reads over the services
lib/
  config.ts              Contact channels, sizes, delivery zones
  data/catalog.ts        Perfumes, gift sets, oils
  services/              cart, inventory, customers, orders, coupons, admin, loginHistory
  storage.ts             The only localStorage touchpoint (+ useStored hook)
types/index.ts           Domain types / data contract
```

## Try it
* **Coupons:** `WELCOME10`, `BLOOM20`, `FLAT100`, `FIRST15`.
* **Admin:** open `/admin` (footer link). First visit shows the owner setup wizard (server-side, works only until an owner exists). Then add managers with
  per-section permissions; disabling/hiding/archiving an item in Inventory removes it from the storefront.
* **Phone format:** `01XXXXXXXXX` / `+8801XXXXXXXXX`. **Passwords (customers):** 8+ chars, letter + number.
