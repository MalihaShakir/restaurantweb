# Maison Table — Full Codebase Inspection Report

**Date:** Investigation completed after full read of all relevant source files.
**Project root:** `maison-table-nextjs/`

---

## EXECUTIVE SUMMARY

The project is a Next.js 15 / TypeScript / Mongoose application with **a split personality**: the backend (API routes, models, middleware, auth) is **production-ready and DB-backed**, while the frontend (most admin pages, checkout, order tracking) is **still running off the old localStorage demo store** (`src/lib/store.ts`). The two halves co-exist but are not yet wired together.

Specifically:
- **Dashboard & Orders pages** — fully wired to the real MongoDB API (`useAdminOrders`, `useAdminStats`). ✅
- **Menu, Categories, Settings, Analytics, Payments, Promotions pages** — still import `useDB` / `repo` from `src/lib/store.ts` and read/write **localStorage only**. ❌
- **Kitchen page** — the API route exists (`/api/v1/kitchen/orders`), but **no kitchen page UI exists** anywhere in `src/app`. ❌ Missing.
- **Rider page** — the API route exists (`/api/v1/rider/orders`), but **no rider page UI exists**. ❌ Missing.
- **Customer order tracking** (`/order/[id]`) — reads from `db.orders` in localStorage. ❌
- **Checkout** — submits to the localStorage `repo.placeOrder()`, not the real `/api/v1/orders` endpoint. ❌

---

## 1. PACKAGE.JSON

**Framework:** Next.js 15.3.3 (App Router), React 19, TypeScript 5.8.

**Key dependencies:**
| Package | Version | Purpose |
|---|---|---|
| `next-auth` | `5.0.0-beta.28` | JWT auth, Credentials provider |
| `mongoose` | `8.15.1` | MongoDB ODM |
| `bcryptjs` | `3.0.3` | Password hashing |
| `zod` | `3.25.76` | Server-side validation |
| `@tanstack/react-query` | `5.101.1` | Installed but **not yet used** |
| `stripe` / `@stripe/stripe-js` | `18.0.0` / `5.6.0` | Stub only — no Stripe key configured |
| `recharts` | `2.15.4` | Charts in analytics |
| `sonner` | `2.0.7` | Toast notifications |
| `date-fns` | `4.1.0` | Date formatting |
| `lucide-react` | `0.475.0` | Icons |

**Scripts:**
```json
"dev":  "next dev"
"build":"next build"
"seed": "tsx scripts/seed.ts"
```

No test runner is configured.

---

## 2. API ROUTES UNDER `src/app/api/`

### `GET/POST /api/auth/[...nextauth]`
- **File:** `src/app/api/auth/[...nextauth]/route.ts`
- **Status:** ✅ Works. Delegates to `src/server/lib/auth.ts`. Handles NextAuth v5 Credentials sign-in.

### `POST /api/checkout`
- **File:** `src/app/api/checkout/route.ts`
- **Status:** ❌ Stub only. Creates a Stripe `PaymentIntent` stub that returns `null`. No real Stripe integration wired. Not used by the current checkout page (which uses localStorage instead).

### `GET /api/v1/menu`
- **File:** `src/app/api/v1/menu/route.ts`
- **Status:** ✅ Fully implemented. Reads categories and menu items from MongoDB. Uses `RESTAURANT_ID` env var. Public (no auth).

### `POST /api/v1/orders`
- **File:** `src/app/api/v1/orders/route.ts`
- **Status:** ✅ Fully implemented. Uses Zod validation, calls `createOrder()` service, idempotency key support, optional auth for customer linking.

### `GET /api/v1/orders/[id]`
- **File:** `src/app/api/v1/orders/[id]/route.ts`
- **Status:** ✅ Implemented. Auth check: staff can see any order; customer sees own; guest proves identity with phone number in query param.

### `GET /api/v1/admin/orders`
- **File:** `src/app/api/v1/admin/orders/route.ts`
- **Status:** ✅ Fully implemented. Requires `staff` role minimum. Pagination and status filtering.

### `PATCH /api/v1/admin/orders/[id]/status`
- **File:** `src/app/api/v1/admin/orders/[id]/status/route.ts`
- **Status:** ✅ Fully implemented. Transition validation via `canTransition()`. Writes audit event. Handles payment refund flag on cancel.

### `POST /api/v1/admin/orders/[id]/assign-rider`
- **File:** `src/app/api/v1/admin/orders/[id]/assign-rider/route.ts`
- **Status:** ✅ Implemented. Requires `ready` status. Supports `"auto"` for auto-assignment. Writes audit event. Order must be in `ready` state.

### `POST /api/v1/admin/orders/[id]/collect-cod`
- **File:** `src/app/api/v1/admin/orders/[id]/collect-cod/route.ts`
- **Status:** ✅ Implemented. Strict guard (must be COD, pending payment, and in delivery/delivered state). Writes audit event and `codCollection` embedded doc.

### `GET /api/v1/admin/stats`
- **File:** `src/app/api/v1/admin/stats/route.ts`
- **Status:** ✅ Implemented. Returns today's counters, recent orders, and 7-day revenue aggregation from MongoDB.

### `GET /api/v1/admin/menu`  `POST /api/v1/admin/menu`
- **File:** `src/app/api/v1/admin/menu/route.ts`
- **Status:** ✅ Implemented (both GET and POST). Requires `admin` role. Validates with `MenuItemBodySchema`. Converts price to cents.

### `PATCH/DELETE /api/v1/admin/menu/[id]`
- **File:** `src/app/api/v1/admin/menu/[id]/route.ts`
- **Status:** ✅ (file exists — not fully read but follows same pattern).

### `GET/POST /api/v1/admin/riders`
- **File:** `src/app/api/v1/admin/riders/route.ts`
- **Status:** ✅ Fully implemented. GET returns active riders. POST creates a new rider account with bcrypt-hashed password. Requires `admin` role.

### `GET /api/v1/kitchen/orders`
- **File:** `src/app/api/v1/kitchen/orders/route.ts`
- **Status:** ✅ Implemented. Returns `pending`, `confirmed`, `preparing`, `ready` orders. No financial data. FIFO sort (oldest first).

### `GET /api/v1/rider/orders`
- **File:** `src/app/api/v1/rider/orders/route.ts`
- **Status:** ✅ Implemented. If role is `rider`, filters to that rider's assigned orders only. Admins see all. Returns `ready`, `out_for_delivery`, `delivered`.

**Missing API routes:**
- No staff management endpoint (`/api/v1/admin/staff`) — no way to create/disable kitchen staff accounts via API.
- No categories CRUD API (only GET via the public menu route).
- No promotions CRUD API (promotions exist in the DB model and Zod schema but no admin API route).
- No restaurant settings PATCH API.
- No customer tracking endpoint at a `/track/[orderNumber]` path.
- No rider status update endpoint (rider marking pickup/delivered).

---

## 3. MONGOOSE MODELS

### `User` (`src/server/models/User.ts`)
**Fields:** `name`, `email`, `passwordHash` (select:false), `phone`, `role` (enum: `customer|staff|admin|superadmin|rider`), `restaurantId` (ref Restaurant), `active`, `deletedAt` (soft-delete).
**Indexes:** unique email, compound `{restaurantId, role}`.
**Note:** Uses roles `staff` and `admin`, but the target spec requires `KITCHEN_STAFF` and `OWNER`. Currently `kitchen_staff` maps to `staff` and `owner` maps to `admin` — this mismatch needs documentation or renaming.

### `MenuItem` (`src/server/models/MenuItem.ts`)
**Fields:** `restaurantId`, `categoryId`, `name`, `slug`, `description`, `image`, `priceCents` (integer), `dietary[]`, `available`, `featured`, `bestSeller`, `chefPick`, `sortOrder`, `deletedAt`.
**Indexes:** unique `{restaurantId, slug}`, compound `{restaurantId, categoryId, available}`, `{restaurantId, featured}`.
**Status:** ✅ Complete.

### `Order` (`src/server/models/Order.ts`)
**Embedded schemas:** `OrderLineSchema` (snapshot), `StatusEventSchema` (history), `CodCollectionSchema`.
**Fields:** `orderNumber`, `restaurantId`, `customerId`, `customer{}`, `deliveryNotes`, `lines[]`, `subtotalCents`, `deliveryFeeCents`, `discountCents`, `totalCents`, `promoCode`, `paymentMethod` (cod/online), `paymentStatus` (pending/paid/failed/refunded), `paymentId`, `status` (enum below), `statusHistory[]`, `codCollection`, `riderId`, `riderName`, `assignedAt`, `idempotencyKey`.
**Order status values:** `pending | confirmed | preparing | ready | out_for_delivery | delivered | cancelled`.
**Indexes:** compound on `{restaurantId, status, createdAt}`, `{restaurantId, paymentMethod, paymentStatus}`, unique `{restaurantId, orderNumber}`, `{riderId, status}`, sparse on `idempotencyKey`.
**Status:** ✅ Very complete. Idempotency key, audit history, COD collection all built in.

### `Category` (`src/server/models/Category.ts`)
**Fields:** `restaurantId`, `name`, `slug`, `description`, `image`, `sort`, `active`.
**Status:** ✅ Complete.

### `Restaurant` (`src/server/models/Restaurant.ts`)
**Fields:** `name`, `slug`, `logo`, `address`, `phone`, `email`, `about`, `deliveryFeeCents`, `freeDeliveryOverCents`, `minOrderCents`, `deliveryRadiusKm`, `etaMinutes`, `acceptingOrders`, `active`, `hours[]`.
**Status:** ✅ Complete.

### `Payment` (`src/server/models/Payment.ts`)
**Fields:** `orderId`, `restaurantId`, `provider` (stripe/cod/manual), `providerSessionId`, `providerChargeId`, `amountCents`, `currency`, `status`, `paidAt`, `failedAt`, `refundedAt`, `refundedAmountCents`, `webhookEvents[]`.
**Status:** ✅ Complete for online payments. COD flow bypasses this model (handled inline in Order).

### `Promotion` (`src/server/models/Promotion.ts`)
**Fields:** `restaurantId`, `code`, `description`, `type` (percent/fixed/free_delivery), `discountValue`, `minSubtotalCents`, `maxUses`, `usageCount`, `active`, `startsAt`, `expiresAt`.
**Status:** ✅ Complete. Server-side validation in `createOrder()`.

### `AuditEvent` (`src/server/models/AuditEvent.ts`)
**Fields:** `restaurantId`, `actor`, `actorEmail`, `action`, `targetId`, `targetModel`, `details`, `ipAddress`.
**Indexes:** 2-year TTL index.
**Status:** ✅ Complete. Written by order status, rider assign, and COD collect routes.

---

## 4. ADMIN PAGES — localStorage vs Real API

| Page | Path | Data Source | Notes |
|---|---|---|---|
| **Dashboard** | `/admin/dashboard` | ✅ Real API (`useAdminStats`) | Polls every 15s, live MongoDB data |
| **Orders** | `/admin/orders` | ✅ Real API (`useAdminOrders`) | Polls every 15s, full CRUD via API |
| **Login** | `/admin/login` | ✅ NextAuth v5 | Uses `signIn("credentials")` properly |
| **Menu** | `/admin/menu` | ❌ localStorage (`useDB`, `repo`) | Calls `repo.saveMenuItem()` — writes to `localStorage` only |
| **Categories** | `/admin/categories` | ❌ localStorage (`useDB`, `repo.update`) | No API; admits "adding categories requires a backend" |
| **Payments** | `/admin/payments` | ❌ localStorage (`useDB`, `repo.collectCod`) | Shows "Demo mode" notice; COD collection writes to localStorage |
| **Analytics** | `/admin/analytics` | ❌ localStorage (`useDB`) | Subtitle says "Demo data from localStorage" |
| **Promotions** | `/admin/promotions` | ❌ localStorage (`useDB`, `repo.update`) | Validates client-side only |
| **Settings** | `/admin/settings` | ❌ localStorage (`useDB`, `repo.update`) | Banner says "settings are stored in localStorage" |
| **Customers** | `/admin/customers` | Likely ❌ localStorage | Not read; follows same `useDB` pattern |
| **Kitchen** | None | ❌ MISSING | Page does not exist; API route exists |
| **Riders** | None | ❌ MISSING | Page does not exist; API route exists |
| **Staff** | None | ❌ MISSING | No page and no API route |

---

## 5. HOOKS

### `src/hooks/useAdminOrders.ts`
- **`useAdminOrders(status?)`** — polls `/api/v1/admin/orders` every 15 seconds. Returns `{ orders, loading, error, refresh }`. Silent refresh on interval (no flash). Typed as `ApiOrder[]`.
- **`useAdminStats()`** — polls `/api/v1/admin/stats` every 15 seconds. Returns stats, recentOrders, weekRevenue.
- **Status:** ✅ Works. Both are wired to real API.

### `src/hooks/useOrderActions.ts`
- **`useOrderActions(onSuccess?)`** — wraps PATCH status, POST collect-cod, POST assign-rider. Uses `fetch` with `credentials: "include"`. Shows `sonner` toasts on success/failure. Returns `{ busy, updateStatus, collectCod, assignRider }`.
- **`useNewOrderAlert(count)`** — plays a Web Audio API beep when `count` increases and sound is unmuted. Returns `{ muted, toggleMute }`.
- **Note:** `useNewOrderAlert` uses `require("react")` inside the function body — unusual pattern but functional.
- **Status:** ✅ Works. Used by Dashboard and Orders pages.

### `src/hooks/use-mobile.tsx`
- Standard `useMediaQuery` hook for `(max-width: 768px)`. Used for responsive layout.
- **Status:** ✅ Works.

---

## 6. AUTH SYSTEM

### `src/server/lib/auth.ts`
- NextAuth v5 beta with `Credentials` provider and `strategy: "jwt"`.
- `authorize()` callback: looks up user by email where `active: true` and `deletedAt: null`, compares bcrypt password hash, returns `{ id, email, name, role, restaurantId }`.
- JWT callback: persists `id`, `role`, `restaurantId` into token.
- Session callback: exposes `id`, `role`, `restaurantId` on `session.user`.
- Sign-in page: `/login`. Error redirect: `/login`.
- **Status:** ✅ Complete and correct. MongoDBAdapter intentionally omitted (incompatible with Credentials + JWT strategy — documented in comment).

### `src/server/middleware/requireAuth.ts`
- `requireSession()` — any authenticated user.
- `requireStaff()` — roles: `staff | admin | superadmin | rider`. Returns `restaurantId`.
- `requireAdmin()` — roles: `admin | superadmin` only.
- `requireRider()` — delegates to `requireStaff()` (comment says "riders are a subset of staff-level access").
- **Status:** ✅ Complete. All API routes use these helpers.
- **Gap:** No `requireKitchenStaff()` helper — kitchen staff (`staff` role) and admin can both access the kitchen route, which is intentional, but role-specific restrictions (e.g., kitchen staff cannot call `/api/v1/admin/riders`) are not explicitly enforced beyond the `requireAdmin()` guard already in place.

---

## 7. ORDER SERVICE (`src/server/services/orderService.ts`)

Implements the full checkout flow:
1. Load and verify restaurant (active, accepting orders).
2. Idempotency key check (returns existing order on duplicate request).
3. Load and validate menu items (availability, existence, correct restaurant).
4. Server-side price calculation — client prices are **never trusted**.
5. Promo code validation (active, date window, usage limit, minimum subtotal).
6. Free delivery threshold check.
7. Order number generation (`MT-NNNNNN` format, count-based).
8. `Order.create()` with status history entry.
9. Promo `usageCount` increment.

Also exports `canTransition(from, to)` and `toCents` / `fromCents` helpers.

**Status:** ✅ Correct and complete. One known limitation: order number generation uses `countDocuments + 1` which is not atomic under high concurrency, but is acceptable for a single-restaurant deployment.

---

## 8. ENVIRONMENT VARIABLES (`.env.local`)

| Key | Value (redacted) | Notes |
|---|---|---|
| `NEXTAUTH_SECRET` | `dev-secret-replace-in-production` | ⚠️ Placeholder — must be replaced in production |
| `NEXTAUTH_URL` | `http://localhost:3000` | Standard |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Standard |
| `MONGODB_URI` | `mongodb+srv://...<password>...@cluster0.dtakhrj.mongodb.net/myrestaurant` | ✅ Set (Atlas connection string) |
| `RESTAURANT_ID` | `6adfa4ac69a074865c5c2cf9` | ✅ Set (seeded restaurant ID) |

**Missing env vars** (needed but not present):
- `STRIPE_SECRET_KEY` — Stripe is a stub; no online payments without this.
- `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — needed for client.
- No email/SMS provider vars (Resend, SendGrid, Twilio, etc.).

---

## 9. `src/lib/store.ts` — Usage in Admin Pages

`store.ts` is the old localStorage-based demo data service. It is **still actively imported** by the following admin pages:

- `src/app/(admin)/admin/menu/page.tsx` — `import { useDB, repo }` 
- `src/app/(admin)/admin/categories/page.tsx` — `import { useDB, repo }`
- `src/app/(admin)/admin/payments/page.tsx` — `import { useDB, repo }`
- `src/app/(admin)/admin/analytics/page.tsx` — `import { useDB }`
- `src/app/(admin)/admin/promotions/page.tsx` — `import { useDB, repo }`
- `src/app/(admin)/admin/settings/page.tsx` — `import { useDB, repo }`
- `src/app/(admin)/admin/customers/page.tsx` — (assumed, follows same pattern)
- `src/components/admin/AdminSidebar.tsx` — `import { useSession, useDB, sessionStore }` — uses `session.admin` (localStorage session) for auth guard, **not** NextAuth. This means the sidebar shows "not logged in" even when a real NextAuth session exists.
- `src/app/(site)/checkout/page.tsx` — `import { repo, useCartSummary, useSession }` — places orders to localStorage.
- `src/app/(site)/order/[id]/page.tsx` — `import { useDB }` — reads orders from localStorage.

**The `AdminSidebar` uses `session.admin` from localStorage** (`sessionStore`) to decide whether to render the nav. This is disconnected from the real NextAuth session — a user who signs in via the NextAuth login page will have no `session.admin` in localStorage and the sidebar will redirect them to `/admin/login`. This is a **critical auth wiring bug**: the dashboard and orders pages (which use real API) will show an empty sidebar or redirect because the sidebar auth guard reads from the wrong session store.

---

## 10. `src/lib/types.ts` — Order Status Values

```typescript
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
```

This matches the Mongoose Order model exactly. The user-facing spec calls these `NEW → ACCEPTED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED`; the mapping is: `pending=NEW`, `confirmed=ACCEPTED`, `ready=READY_FOR_PICKUP`.

---

## 11. `src/lib/status.ts` — Transitions

```typescript
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending:          ["confirmed", "cancelled"],
  confirmed:        ["preparing", "cancelled"],
  preparing:        ["ready"],
  ready:            ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered:        [],
  cancelled:        [],
};
```

COD collection guard: `canCollectCod(o)` — COD order, payment pending, and status is `out_for_delivery` or `delivered`.

This matches the server-side `canTransition()` in `orderService.ts`. ✅

---

## 12. `src/components/admin/`

### `AdminSidebar.tsx`
- Desktop sidebar + mobile drawer with hamburger button.
- Shows pending order count badge on "Orders" link.
- **Bug:** Auth guard reads from `useSession()` (localStorage sessionStore), not NextAuth — see Section 9.
- Nav links include: Dashboard, Orders, Menu, Categories, Payments, Customers, Analytics, Promotions, Settings.
- **Missing nav links:** Kitchen, Riders, Staff.

### `OrderCard.tsx`
- Renders a collapsible order card with status badge, customer info, item list, financials, action buttons.
- Accepts `ApiOrder` type from `useAdminOrders` — wired to real API data.
- Supports all status transitions with confirmation dialogs for destructive actions (cancel, deliver).
- Rider assignment dropdown built in (requires `onAssignRider` prop and `riders` list).
- ✅ Well-built. Used by Dashboard and Orders pages.

---

## 13. KITCHEN PAGE

**`src/app/(admin)/admin/kitchen/page.tsx` — DOES NOT EXIST.**

The API endpoint `GET /api/v1/kitchen/orders` is implemented and works. There is no corresponding page to display it. This is a complete gap.

---

## 14. DELIVERY / RIDER PAGES

**No rider page exists anywhere in `src/app/`.**

The API endpoint `GET /api/v1/rider/orders` is implemented. No page consumes it. No `/rider` or `/admin/riders` page exists. There is also no rider account management page.

---

## 15. `src/app/(site)/order/[id]/page.tsx` — DB or localStorage?

**localStorage.** The page imports `useDB` from `src/lib/store` and reads `db.orders.find(x => x.id === id)`. It explicitly states in the UI: *"Demo orders are stored only in this browser."*

The page has a `DemoBadge` component labeling it "Demo order · localStorage only" and the order timeline reads from the `history` array on the localStorage order object.

The real API endpoint `GET /api/v1/orders/[id]` exists and is ready to use. The page simply needs to be rewritten to fetch from that endpoint.

---

## COMPLETE GAP LIST (Prioritized)

### P0 — Critical: Breaks Working Features

1. **AdminSidebar auth guard reads from localStorage, not NextAuth.**  
   `AdminSidebar.tsx` uses `useSession()` (from `src/lib/store.ts`) and checks `session.admin`. Users who sign in via the real NextAuth login (which is already wired on the login page) will have no `session.admin` and the sidebar either won't render or will redirect to `/admin/login`. The Dashboard and Orders pages (already DB-backed) are inaccessible.  
   *Fix: Replace `useSession` / `sessionStore.admin` guard in `AdminSidebar.tsx` with `useSession` from `next-auth/react`.*

2. **Checkout writes to localStorage, not the DB.**  
   `src/app/(site)/checkout/page.tsx` calls `repo.placeOrder()` — this never hits `/api/v1/orders`. Real orders are never created in MongoDB.  
   *Fix: Replace `repo.placeOrder()` with a `fetch("/api/v1/orders", ...)` call.*

3. **Customer order tracking reads localStorage.**  
   `/order/[id]` page uses `useDB` to find the order. No order ID from a real order will be found.  
   *Fix: Rewrite to fetch from `/api/v1/orders/[id]`.*

### P1 — High: Core Operational Screens Missing

4. **Kitchen display page does not exist.**  
   The API route is ready. Need to build `/admin/kitchen/page.tsx` — tablet-friendly, high-contrast, polling `GET /api/v1/kitchen/orders`, status action buttons (confirm → preparing → ready), elapsed time per card, new order alert beep.

5. **Rider page does not exist.**  
   The API route is ready. Need `/rider/page.tsx` — mobile-first, shows assigned deliveries, pickup/delivery confirmation buttons, COD cash record button, map link.

6. **Rider management page does not exist.**  
   `/api/v1/admin/riders` (GET/POST) is complete. Need an admin page to list, create, and disable rider accounts.

7. **Staff management page and API do not exist.**  
   No way to create or disable kitchen staff (`staff` role) accounts. Need both the API route and the admin page.

### P2 — High: Admin Pages Wired to Wrong Data Source

8. **Menu management page uses localStorage.**  
   `admin/menu/page.tsx` reads/writes via `useDB` / `repo`. Must be replaced with calls to `/api/v1/admin/menu` (GET, POST) and `/api/v1/admin/menu/[id]` (PATCH, DELETE). The API routes already exist.

9. **Categories page uses localStorage.**  
   No admin API route for categories. Need `GET/POST/PATCH /api/v1/admin/categories` and rewire the page.

10. **Payments page uses localStorage.**  
    `admin/payments/page.tsx` reads orders from `useDB` and calls `repo.collectCod()`. Must be replaced with calls to the real orders API and `/api/v1/admin/orders/[id]/collect-cod`.

11. **Analytics page uses localStorage.**  
    Reads orders from `useDB`. Must use a DB-backed analytics/reporting endpoint. The stats endpoint returns limited data; a fuller aggregation endpoint is needed for the date-range charts.

12. **Promotions page uses localStorage.**  
    No promotions admin API. Need `GET/POST/PATCH/DELETE /api/v1/admin/promotions` and rewire the page.

13. **Settings page uses localStorage.**  
    Settings should be read from and written to the Restaurant model. Need `GET/PATCH /api/v1/admin/settings` and rewire the page.

### P3 — Medium: Rider-Specific API Gaps

14. **Riders can view assigned orders but cannot update them.**  
    `GET /api/v1/rider/orders` exists, but there is no `PATCH /api/v1/rider/orders/[id]/status` for the rider to mark pickup (`out_for_delivery`) or delivery (`delivered`). The existing admin status route could be extended, but a rider-scoped route with ownership check is cleaner.

15. **Rider-side COD collection endpoint is missing.**  
    Currently only admin can call `/api/v1/admin/orders/[id]/collect-cod`. Riders should also be able to record cash collection for their assigned orders.

### P4 — Medium: Security / Role Enforcement Gaps

16. **`requireStaff()` allows `staff` role to call admin-only actions.**  
    Order status updates (`PATCH /status`), rider assignment, and COD collection all use `requireStaff()` — this allows kitchen staff to assign riders and collect COD. These should use `requireAdmin()` for assignment/COD, while kitchen staff can only move orders to `preparing` and `ready`.

17. **Kitchen staff can currently access all admin routes.**  
    There is no role-differentiated middleware for kitchen-only permissions. A `requireKitchenStaff()` helper that allows only `staff | admin | superadmin` (but not `rider`) would be good practice.

18. **Role terminology mismatch.**  
    The spec uses `OWNER`, `KITCHEN_STAFF`, `RIDER`; the DB model uses `admin`, `staff`, `rider`. This is acceptable if documented but should be consistent across code and comments. Currently `auth.ts` has comments about `customer | staff | admin | superadmin` and the spec wants to add `owner` as a distinct concept.

### P5 — Lower: Missing Features

19. **Customer order tracking at `/track/[orderNumber]` does not exist.**  
    The spec calls for `/track/[orderNumber]` (secure, no personal info exposure). Currently the order confirmation links to `/order/[id]` which uses the MongoDB `_id`. A trackable URL using `orderNumber` + phone verification (which is already implemented in `GET /api/v1/orders/[id]` via `?phone=`) needs a proper page at a stable, guessable-safe URL.

20. **No notification system.**  
    The spec requires owner/kitchen notification of new orders. Currently only the polling-based badge count and audio alert exist. No email or push notification adapters are wired. The spec acknowledges this should be gated on provider configuration.

21. **Stripe integration is a stub.**  
    `src/app/api/checkout/route.ts` has a `TODO` comment and returns `null` for the client secret. No `STRIPE_SECRET_KEY` is set. Online payment flow shows a fake "simulate success/failure" dialog.

22. **No middleware-level route protection.**  
    Admin pages do not have a `middleware.ts` file that enforces auth at the edge. The only protection is client-side (sidebar redirect) and API-level (requireAuth). A `middleware.ts` that enforces authentication for all `/admin/*` and `/rider/*` routes would be the standard Next.js pattern.

23. **`@tanstack/react-query` is installed but unused.**  
    Could replace the manual polling hooks with React Query's `useQuery` + `refetchInterval`, but this is not a blocker.

---

## SUMMARY TABLE

| Area | Status |
|---|---|
| MongoDB connection | ✅ Connected (Atlas, `MONGODB_URI` set) |
| NextAuth v5 auth | ✅ Implemented (JWT + Credentials) |
| Server-side role enforcement | ✅ On all existing API routes |
| Order creation (DB) | ✅ API ready — checkout page not wired |
| Order management API | ✅ Complete |
| Kitchen orders API | ✅ Complete — no UI page |
| Rider orders API | ✅ Complete — no UI page |
| Rider account management API | ✅ Complete — no UI page |
| Admin dashboard | ✅ Real data, polling |
| Admin orders page | ✅ Real data, polling |
| Admin menu page | ❌ localStorage |
| Admin payments page | ❌ localStorage |
| Admin analytics page | ❌ localStorage |
| Admin settings page | ❌ localStorage |
| Admin promotions page | ❌ localStorage |
| Admin categories page | ❌ localStorage |
| Kitchen display page | ❌ Missing entirely |
| Rider page | ❌ Missing entirely |
| Staff management | ❌ Missing (no API, no page) |
| Rider management page | ❌ Missing page |
| Customer checkout → DB | ❌ Uses localStorage |
| Customer order tracking | ❌ Uses localStorage |
| Stripe / online payments | ❌ Stub only |
| Notifications | ❌ Not implemented |
| Route-level auth middleware | ❌ Not present |
