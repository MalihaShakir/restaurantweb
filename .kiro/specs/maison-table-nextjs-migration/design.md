# Design Document

## maison-table-nextjs-migration

## Overview

This design describes the architecture for migrating the Maison Table restaurant website from TanStack Start/Vite to Next.js 15 App Router. The migration produces a new `maison-table-nextjs/` directory at the workspace root, leaving `pixel-perfect-replica-main/` untouched. The output project is immediately deployable on Vercel and reproduces every customer-facing page at pixel-level fidelity while scaffolding admin routes and server-side libraries for future backend wiring.

The central architectural principle is **progressive enhancement through the App Router model**: pages default to Server Components unless they touch the browser (localStorage, event listeners, `useState`/`useEffect`), in which case they are explicitly marked `"use client"`. Since the entire data layer is localStorage-based, the majority of interactive components become Client Components, but the page shell, metadata, and layout wrappers remain server-rendered.

---

## Architecture

### High-Level Structure

```
workspace/
├── pixel-perfect-replica-main/   ← SourceProject: UNTOUCHED
└── maison-table-nextjs/          ← NextApp: output of migration
    ├── src/
    │   ├── app/                  ← App Router root
    │   │   ├── (auth)/           ← RouteGroup: no site chrome
    │   │   ├── (site)/           ← RouteGroup: SiteLayout wrapper
    │   │   ├── (admin)/          ← RouteGroup: admin-theme + sidebar
    │   │   └── api/              ← API route handlers
    │   ├── components/
    │   │   ├── ui/               ← shadcn/ui Radix components
    │   │   ├── site/             ← customer-facing components
    │   │   └── admin/            ← admin panel components
    │   ├── lib/                  ← shared logic + scaffolded backends
    │   ├── hooks/                ← custom React hooks
    │   └── assets/               ← static images
    ├── public/                   ← favicon, robots.txt
    ├── next.config.ts
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── .env.local.example
    ├── vercel.json
    └── README.md
```

### Rendering Model

| Layer | Rendering | Reason |
|---|---|---|
| Root layout (`src/app/layout.tsx`) | Server Component | Emits HTML shell, font preconnects, metadata |
| `(site)` layout | Server Component | Renders `SiteLayout` shell; no browser APIs needed at layout level |
| `(admin)` layout | Server Component | Applies `admin-theme` class; sidebar rendered as Client Component |
| `(auth)` pages | Client Component | Form state, localStorage login |
| Customer page shells | Server Component | Static markup for SEO |
| Interactive page regions | Client Component | Cart, qty stepper, filters, dialogs |
| Admin pages | Client Component | All admin data comes from localStorage |
| API routes | Server (Route Handler) | NextAuth, checkout stub |

### Data Flow

```
Browser localStorage
       │
       ▼
createStore<T>(key, init)   ← store.ts
       │
  ┌────┴────────────┐
  │                 │
dbStore          cartStore    sessionStore
  │                 │
  ▼                 ▼
useDB()         useCart()     useSession()
  │                 │
  └────────┬────────┘
           ▼
   React Client Components
   (useSyncExternalStore → re-renders on change)
```

The `createStore` function already guards against SSR by checking `typeof window === "undefined"` and returning `serverState` (initialised from `init()`) on the server. This makes `useSyncExternalStore` safe to call in both Server and Client Components, but in practice all store-reading components must be Client Components because they subscribe to browser storage events.

### Providers Architecture

React Query is required by components but must be mounted client-side. A dedicated `src/components/Providers.tsx` Client Component wraps `QueryClientProvider` and is imported once in the root layout:

```tsx
// src/components/Providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

---

## Component Architecture

### Route Groups and Layouts

#### Root Layout (`src/app/layout.tsx`)

```tsx
// Server Component
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Maison Table",
  description: "Fine dining delivered to your door.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
```

#### Site Layout (`src/app/(site)/layout.tsx`)

Wraps every customer page in `SiteLayout` (header, cart panel, footer). `SiteLayout` itself is a Client Component because it subscribes to the `maison:open-cart` custom event and observes scroll position for header transparency.

#### Admin Layout (`src/app/(admin)/layout.tsx`)

Applies the `admin-theme` CSS class to a wrapper div. The `AdminSidebar` component is a Client Component (uses `usePathname` for active link highlighting and localStorage for session checks).

#### Auth Layout (`src/app/(auth)/layout.tsx`)

Minimal wrapper — centred card with the Maison Table wordmark and no site navigation.

### Site Components

All site components are ported from `pixel-perfect-replica-main/src/components/site/`. The only changes are:

| SourceProject import | NextApp replacement |
|---|---|
| `import { Link } from "@tanstack/react-router"` | `import Link from "next/link"` |
| `import { useNavigate } from "@tanstack/react-router"` | `import { useRouter } from "next/navigation"` |
| `navigate({ to: "/cart" })` | `router.push("/cart")` |
| Route `loader` data | Direct `useDB()` / `useCart()` calls |

Every component that uses these hooks or reads localStorage is annotated `"use client"`.

### Admin Components

Admin pages are full Client Components that replicate the SourceProject admin routes. Because all nine admin routes share the sidebar and data layer, they are structured as:

```
src/components/admin/
├── AdminSidebar.tsx      ← navigation + session check
├── OrderTable.tsx        ← orders list with status controls
├── MenuTable.tsx         ← menu CRUD table
├── CategoryTable.tsx
├── PaymentTable.tsx
├── AnalyticsCharts.tsx   ← recharts wrappers
└── SettingsForm.tsx
```

Each admin page file imports the relevant component and is annotated `"use client"` at the page level too (so Next.js never attempts SSR for any admin page).

---

## Routing Structure

### Customer Routes

| URL | File | Notes |
|---|---|---|
| `/` | `src/app/(site)/page.tsx` | Hero + sections; hydration-safe |
| `/menu` | `src/app/(site)/menu/page.tsx` | Filters via `useState`; Client Component |
| `/menu/[slug]` | `src/app/(site)/menu/[slug]/page.tsx` | Dynamic segment |
| `/cart` | `src/app/(site)/cart/page.tsx` | Full Client Component |
| `/checkout` | `src/app/(site)/checkout/page.tsx` | Full Client Component |
| `/order/[id]` | `src/app/(site)/order/[id]/page.tsx` | Dynamic segment |
| `/about` | `src/app/(site)/about/page.tsx` | Mostly static; can be Server Component |
| `/contact` | `src/app/(site)/contact/page.tsx` | Form → Client Component |
| `/account` | `src/app/(site)/account/page.tsx` | Auth guard + Client Component |
| `/account/orders` | `src/app/(site)/account/orders/page.tsx` | Auth guard + Client Component |

### Auth Routes

| URL | File |
|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/register` | `src/app/(auth)/register/page.tsx` |

### Admin Routes

| URL | File |
|---|---|
| `/admin/login` | `src/app/(admin)/admin/login/page.tsx` |
| `/admin/dashboard` | `src/app/(admin)/admin/dashboard/page.tsx` |
| `/admin/orders` | `src/app/(admin)/admin/orders/page.tsx` |
| `/admin/menu` | `src/app/(admin)/admin/menu/page.tsx` |
| `/admin/categories` | `src/app/(admin)/admin/categories/page.tsx` |
| `/admin/payments` | `src/app/(admin)/admin/payments/page.tsx` |
| `/admin/analytics` | `src/app/(admin)/admin/analytics/page.tsx` |
| `/admin/settings` | `src/app/(admin)/admin/settings/page.tsx` |

### API Routes

| URL | File | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth v5 catch-all |
| `/api/checkout` | `src/app/api/checkout/route.ts` | Stripe payment intent stub |

---

## Data Models

All data models are defined in `src/lib/types.ts` and copied verbatim from the SourceProject. No schema changes are required for the Next.js migration.

### Core Interfaces

```typescript
// Abbreviated — see src/lib/types.ts for full definitions

interface Category { id, name, slug, description, sort }

interface MenuItem {
  id, slug, name, description, price, categoryId,
  image, dietary: Dietary[], available, featured,
  bestSeller?, chefPick?
}

interface Order {
  id, customer, lines: OrderLine[],
  subtotal, deliveryFee, discount, total,
  paymentMethod: "cod" | "online",
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  status: OrderStatus,
  createdAt, updatedAt, history: OrderEvent[]
}

interface DB {
  categories, menu, orders, promotions, staff, settings, notifications
}
```

### LocalStorage Schema

Three localStorage keys are used, all initialized from `buildSeed()` on first visit:

| Key | Type | Contents |
|---|---|---|
| `maison-db-v1` | `DB` | Full database: menu, orders, settings, etc. |
| `maison-cart-v1` | `{ lines: CartLine[]; promo: string \| null }` | Active cart |
| `maison-session-v1` | `{ customer, admin, myOrders, sound, simulate }` | Auth session + preferences |

---

## Design System

### Tailwind v4 Configuration

The SourceProject uses the Vite plugin (`@tailwindcss/vite`). The NextApp uses the PostCSS plugin (`@tailwindcss/postcss`) in `postcss.config.mjs`:

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Global CSS (`src/app/globals.css`)

The global CSS file reproduces the complete SourceProject `styles.css` with one change: the `@import "tw-animate-css"` line is removed and the required keyframes are defined inline (only `reveal-up` is used by the SourceProject itself). Structure:

```css
@import "tailwindcss" source(none);
@source "../src";

/* @theme inline: font vars, radius vars, color token wiring */
@theme inline { … }

/* :root — all oklch color tokens, shadow custom properties */
:root { … }

/* .admin-theme — cooler neutral overrides */
.admin-theme { … }

/* @layer base — typography, focus ring, reduced motion */
@layer base { … }

/* @utility blocks */
@utility shadow-soft { … }
@utility shadow-lift { … }
@utility bg-scrim { … }
@utility eyebrow { … }
@utility container-site { … }

/* @keyframes (inline, no tw-animate-css import) */
@keyframes reveal-up { … }
@utility reveal { … }
```

### Font Loading

Fonts are loaded via `next/font/google` in the root layout (see Root Layout section above). The CSS variables `--font-serif` and `--font-sans` are injected as `variable` props on the `<html>` element. The `@theme inline` block references these variables so all Tailwind font utilities resolve correctly.

---

## Components and Interfaces

### Authentication (Scaffolded — `src/lib/auth.ts`)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // TODO: replace with MongoDB adapter lookup
        if (!credentials?.email || !credentials?.password) return null;
        return null; // stub
      },
    }),
  ],
  // TODO: add MongoDBAdapter(clientPromise) when MONGODB_URI is set
  secret: process.env.NEXTAUTH_SECRET,
});
```

### Database Connection (Scaffolded — `src/lib/db.ts`)

Connection caching pattern prevents multiple Mongoose connections in serverless warm-start environments:

```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "";

interface MongooseCache { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
declare global { var mongoose: MongooseCache | undefined }

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI not set — skipping database connection");
    return null;
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Stripe (Scaffolded — `src/lib/stripe.ts`)

```typescript
import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-10-28.acacia" })
  : null;
```

### Checkout API Route (Stub — `src/app/api/checkout/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const body = await request.json();
  // TODO: create real PaymentIntent
  return NextResponse.json({ clientSecret: null, message: "Stripe stub — wire up PaymentIntent here" });
}
```

---

## Authentication and Session Guards

Both customer and admin routes implement client-side redirect guards using `useEffect` + `useRouter`:

```typescript
// Pattern used in /account, /account/orders, and all /admin/* routes (except /admin/login)
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";

export default function ProtectedPage() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.customer) router.replace("/login"); // or "/admin/login" for admin
  }, [session.customer, router]);

  if (!session.customer) return null; // prevent flash of protected content
  return <PageContent />;
}
```

This pattern is chosen over middleware-based redirects because the session lives in localStorage, which is inaccessible in middleware (server-side). Middleware-based redirects would require a cookie-backed session store, which is deferred to the future backend wiring phase.

---

## Hydration Safety

All components that read localStorage must guard against SSR. The `createStore` in `store.ts` already handles this by returning `serverState` when `typeof window === "undefined"`. Additionally, page-level Client Components that need the initial localStorage state must call `useEffect` for any conditional rendering that differs between server and client:

```typescript
// Pattern for hydration-safe localStorage reads at page level
"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/store";

export default function CartPage() {
  const cart = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <CartSkeleton />; // server + first client render
  return <CartContent cart={cart} />;
}
```

---

## Error Handling

### Next.js Error Boundaries

- `src/app/not-found.tsx` — rendered for any unmatched URL; includes "Go home" link to `/`
- `src/app/error.tsx` — rendered for unhandled rendering errors; includes "Try again" button that calls `reset()` from the error boundary

### Scaffolded Library Errors

All three scaffolded libraries (`auth.ts`, `db.ts`, `stripe.ts`) check for undefined environment variables before initialising connections and log a `console.warn` rather than throwing, ensuring the build and `npm run dev` succeed with no `.env.local` file present.

---

## Vercel Deployment

### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default output (not "export") — enables API routes and SSR
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // React 19 compatibility
  experimental: {
    reactCompiler: false,
  },
};

export default nextConfig;
```

### `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### `.env.local.example`

```
NEXTAUTH_SECRET=replace-with-random-secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/maison
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing Strategy

### Approach

This migration is primarily a structural and configuration transformation — moving files between frameworks and replacing routing imports. Testing focuses on:

1. **Structural smoke tests**: Verify that required files, directories, and configuration keys exist.
2. **Property-based tests**: Verify universal invariants that must hold across all files in the project (e.g., no forbidden imports, correct directives).
3. **Example-based unit tests**: Verify specific interactive behaviors and component rendering.
4. **Build integration test**: Run `npm run build` to confirm the project compiles without errors.

### Unit Testing

Each interactive client component should have example-based tests covering:
- Cart open/close via the `maison:open-cart` custom event
- Promo code validation (valid code applies discount; invalid code shows error)
- Quantity stepper increment/decrement/min boundary
- Auth form submit with valid and invalid inputs
- Order redirect after successful `repo.placeOrder()`

### Property Testing

Property tests use a static analysis approach (AST/regex scan of source files) rather than runtime execution, since the properties are about code structure rather than runtime behaviour:
- Scan all `.tsx`/`.ts` files for forbidden imports
- Scan all files referencing localStorage APIs for the `"use client"` directive
- Compare CSS variable names between SourceProject and NextApp global CSS

### Build Verification

Running `npm run build` inside `maison-table-nextjs/` serves as the primary integration gate. A passing build confirms TypeScript correctness, route resolution, and import validity across the entire project.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSS Variable Completeness

*For any* CSS custom property (variable) defined in the SourceProject `styles.css`, that same variable name SHALL appear in the NextApp `src/app/globals.css`.

**Validates: Requirements 2.2, 2.3**

### Property 2: No TanStack Router Imports

*For any* TypeScript or TSX file under `maison-table-nextjs/src/`, the file SHALL NOT contain any import statement that references `@tanstack/react-router` or `@tanstack/react-start`.

**Validates: Requirements 7.7**

### Property 3: Client Component Directive for localStorage Users

*For any* TSX file under `maison-table-nextjs/src/` that contains a reference to `localStorage`, `useDB`, `useCart`, `useSession`, or `useSyncExternalStore`, the first non-comment line of that file SHALL be `"use client"`.

**Validates: Requirements 4.9, 6.9**

### Property 4: Admin Pages Are Client Components

*For any* TSX file that is a page or layout under `src/app/(admin)/`, the file SHALL contain `"use client"` as a directive.

**Validates: Requirements 6.9**

### Property 5: Unauthenticated Customer Redirect

*For any* request to `/account` or `/account/orders` where `sessionStore.customer` is `null`, the rendered component SHALL initiate a navigation to `/login` and SHALL NOT render the protected page content.

**Validates: Requirements 5.3**

### Property 6: Unauthenticated Admin Redirect

*For any* request to an admin route other than `/admin/login` where `sessionStore.admin` is `null`, the rendered component SHALL initiate a navigation to `/admin/login` and SHALL NOT render the protected admin page content.

**Validates: Requirements 6.10**

### Property 7: Excluded Packages Absent

*For any* package listed in the exclusion set (`@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@tailwindcss/vite`, `vite`, `nitro`, `tw-animate-css`), that package SHALL NOT appear as a key in the NextApp `package.json` `dependencies` or `devDependencies` objects.

**Validates: Requirements 1.4**

### Property 8: SourceProject Files Unmodified

*For any* file that existed in `pixel-perfect-replica-main/` before the migration, the byte content of that file SHALL be identical after the migration system runs.

**Validates: Requirements 1.8**
