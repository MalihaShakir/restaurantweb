# Tasks

## maison-table-nextjs-migration

Implementation task list derived from `requirements.md` and `design.md`. All work is performed inside a new `maison-table-nextjs/` directory at the workspace root. `pixel-perfect-replica-main/` must remain byte-for-byte unmodified throughout.

---

## Task 1: Project Scaffold

Create the `maison-table-nextjs/` directory and all top-level configuration files needed to initialise a valid Next.js 15 App Router project.

- [ ] 1.1 Create `maison-table-nextjs/package.json` listing `next@15`, `react@19`, `react-dom@19`, all required UI libraries (`@radix-ui/*`, `sonner`, `lucide-react`, `recharts`, `date-fns`, `react-hook-form`, `zod`, `@tanstack/react-query`, `class-variance-authority`, `tailwind-merge`, `clsx`, `embla-carousel-react`, `react-day-picker`, `react-resizable-panels`, `vaul`, `cmdk`, `input-otp`), and scaffolded backend libraries (`next-auth@5.0.0-beta.28`, `mongoose`, `stripe`, `@stripe/react-stripe-js`). Confirm the exclusion set (`@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@tailwindcss/vite`, `vite`, `nitro`, `tw-animate-css`) is absent. Note: Add `NEXTAUTH_SECRET=dev-secret-replace-in-production` as a non-empty placeholder in `.env.local` (not `.env.local.example`) so `npm run dev` starts without a NextAuth startup error. Do not commit this file.
- [ ] 1.2 Create `maison-table-nextjs/next.config.ts` with `images.remotePatterns` allowing `images.unsplash.com` and no `output: "export"` so API routes and Server Components function correctly.
- [ ] 1.3 Create `maison-table-nextjs/postcss.config.mjs` with `@tailwindcss/postcss` as the sole plugin (replaces the Vite plugin used in SourceProject).
- [ ] 1.4 Create `maison-table-nextjs/tsconfig.json` with `"paths": { "@/*": ["./src/*"] }` matching the SourceProject path-alias convention and TypeScript 5.8 settings.
- [ ] 1.5 Create `maison-table-nextjs/.env.local.example` listing all seven required environment variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- [ ] 1.6 Create `maison-table-nextjs/vercel.json` with `buildCommand: "npm run build"`, `outputDirectory: ".next"`, and `framework: "nextjs"`.
- [ ] 1.7 Create `maison-table-nextjs/README.md` documenting required environment variables, local dev steps (`npm install`, `npm run dev`), and Vercel deployment steps.

**Satisfies:** Requirements 1.1 – 1.6, 8.1, 9.1, 9.2, 9.4

---

## Task 2: Design System

Create `src/app/globals.css` reproducing the complete Tailwind CSS v4 design system from the SourceProject `styles.css`.

- [ ] 2.1 Add `@import "tailwindcss" source(none)`, `@source "../src"`, and `@custom-variant dark (&:is(.dark *));` directives at the top of the file.
- [ ] 2.2 Add `@theme inline` block with all font and radius CSS variable wiring (`--font-serif`, `--font-sans`, `--radius-*`).
- [ ] 2.3 Add `:root` block with all brand oklch color tokens: `--espresso`, `--cream`, `--beige`, `--terracotta`, `--gold`, `--success`, `--warning`, `--info`; all semantic tokens (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`); all chart tokens; all sidebar tokens.
- [ ] 2.4 Add `:root` shadow and gradient custom properties: `--shadow-soft`, `--shadow-lift`, `--gradient-scrim` with the same `oklch` values as the SourceProject.
- [ ] 2.5 Add `.admin-theme` block with cooler neutral palette overrides matching the SourceProject AdminTheme.
- [ ] 2.6 Add `@layer base` block: apply `--font-serif` to `h1`, `h2`, `h3`, `.font-display`; apply `--font-sans` to `body`; configure focus ring reset; add `@media (prefers-reduced-motion: reduce)` block setting `animation-duration` and `transition-duration` to `0.01ms`.
- [ ] 2.7 Add `@utility` blocks for `container-site`, `eyebrow`, `shadow-soft`, `shadow-lift`, and `bg-scrim` with rules identical to the SourceProject.
- [ ] 2.8 Add inline `@keyframes reveal-up` animation and `@utility reveal` class with the same cubic-bezier timing as the SourceProject. Do **not** import `tw-animate-css`.

**Satisfies:** Requirements 2.1 – 2.10

---

## Task 3: Lib Modules

Copy and port all shared library modules from SourceProject into `src/lib/` and `src/hooks/`.

- [ ] 3.1 Copy `src/lib/types.ts` from SourceProject verbatim — all TypeScript interfaces and types (`Category`, `MenuItem`, `Order`, `DB`, `CartLine`, `OrderStatus`, etc.) must be identical.
- [ ] 3.2 Copy `src/lib/store.ts` from SourceProject with one modification: add a `typeof window === 'undefined'` guard inside the `subscribe` function before calling `window.addEventListener`, to prevent a server-side `ReferenceError`. The `get()` function already has an SSR guard. All components that call `useDB()`, `useCart()`, or `useSession()` MUST be Client Components because `subscribe` accesses browser APIs.
- [ ] 3.3 Copy `src/lib/seed.ts` from SourceProject verbatim — `buildSeed()` and the full deterministic initial dataset.
- [ ] 3.4 Copy `src/lib/pricing.ts`, `src/lib/status.ts`, `src/lib/brand.ts`, and `src/lib/utils.ts` from SourceProject verbatim. Do NOT copy `error-capture.ts`, `error-page.ts`, or `lovable-error-reporting.ts` — these are Lovable/Vite-specific files with no Next.js equivalent.
- [ ] 3.5 Copy `src/hooks/use-mobile.tsx` from SourceProject verbatim.

**Satisfies:** Requirements 7.3 – 7.6

---

## Task 4: shadcn/ui Components

Create all Radix UI / shadcn components in `src/components/ui/` — approximately 40 files copied from the SourceProject's `src/components/ui/` directory.

- [ ] 4.1 Copy the following components: `accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`. Note: The source project uses `sonner.tsx` for toast notifications; do NOT create a `toast.tsx` file.
- [ ] 4.2 Verify each file contains no `@tanstack/react-router` or `@tanstack/react-start` imports (Property 2).
- [ ] 4.3 Verify each file that references `localStorage`, `useDB`, `useCart`, `useSession`, or `useSyncExternalStore` carries `"use client"` as its first non-comment line (Property 3).

**Satisfies:** Requirement 7.1

---

## Task 5: Shared Site Components

Port all customer-facing shared components from SourceProject `src/components/site/` and `src/components/` into the NextApp, replacing TanStack Router imports.

- [ ] 5.1 Port `SiteLayout.tsx`: replace `Link` from `@tanstack/react-router` with `next/link`; replace `useNavigate` with `useRouter` from `next/navigation`; replace `navigate({ to: "…" })` calls with `router.push("…")`; add `"use client"` directive (subscribes to `maison:open-cart` event and scroll position).
- [ ] 5.2 Port `CartPanel.tsx`: apply same import replacements; add `"use client"` directive.
- [ ] 5.3 Port `DishCard.tsx`: apply same import replacements; add `"use client"` directive if it writes to `cartStore`.
- [ ] 5.4 Port `DishDialog.tsx`: apply same import replacements; add `"use client"` directive.
- [ ] 5.5 Port `QtyStepper.tsx`: add `"use client"` directive.
- [ ] 5.6 Port `AuthForm.tsx`: apply same import replacements; add `"use client"` directive. IMPORTANT: Remove the `<SiteLayout>` wrapper that is present in the source `AuthForm.tsx`. The `(auth)` route group layout provides the page chrome; `AuthForm` must render only the form content itself.
- [ ] 5.7 Port `OrderTimeline.tsx`: add `"use client"` directive if it reads from `sessionStore`; otherwise may remain a Server Component.
- [ ] 5.8 Port `badges.tsx` to `src/components/badges.tsx` — apply same import replacements where needed.
- [ ] 5.9 Confirm no file in `src/components/site/` or `src/components/` imports from `@tanstack/react-router` or `@tanstack/react-start` after porting (Property 2).
- [ ] 5.10 When porting the menu page logic (`menu.index.tsx`), replace `Route.useSearch()` with `useSearchParams()` from `next/navigation` and wrap the menu page component in `<Suspense>` as required by Next.js 15 App Router. Replace `Route.useNavigate()` search-param calls (e.g. `navigate({ search: { c: slug } })`) with `router.push(`/menu?c=${slug}`)` using `useRouter()` from `next/navigation`.

**Satisfies:** Requirements 7.2, 7.7, 7.8

---

## Task 6: Providers Component

Create the `src/components/Providers.tsx` Client Component that wraps the React Query provider for the root layout.

- [ ] 6.1 Create `src/components/Providers.tsx` annotated with `"use client"`.
- [ ] 6.2 Instantiate `QueryClient` inside a `useState` initialiser to avoid sharing state across requests.
- [ ] 6.3 Wrap `children` in `<QueryClientProvider client={client}>`.

**Satisfies:** Requirements 3.2 (root layout Providers integration), design Providers Architecture section

---

## Task 7: Scaffolded Backend

Create the three scaffolded library files and two API route handlers.

- [ ] 7.1 Create `src/lib/auth.ts` with a NextAuth v5 `auth()` export using a `CredentialsProvider` stub and a comment placeholder for the MongoDB adapter. The `authorize` function returns `null` and does not make any live network requests.
- [ ] 7.2 Create `src/lib/db.ts` with a Mongoose connection helper using the `MONGODB_URI` environment variable. Implement the global connection-caching pattern to prevent multiple connections in serverless warm-start. Log `console.warn` (not throw) when `MONGODB_URI` is absent.
- [ ] 7.3 Create `src/lib/stripe.ts` exporting a `stripe` instance initialised from `STRIPE_SECRET_KEY`, or `null` if the variable is absent.
- [ ] 7.4 Create `src/app/api/auth/[...nextauth]/route.ts` exporting the NextAuth v5 `GET` and `POST` handlers from `src/lib/auth.ts`.
- [ ] 7.5 Create `src/app/api/checkout/route.ts` as a POST stub that returns a `503` JSON response when `stripe` is `null`, or a placeholder `{ clientSecret: null }` response when Stripe is initialised.

**Satisfies:** Requirements 8.1 – 8.7

---

## Task 8: Root Layout

Create `src/app/layout.tsx` as the single HTML shell for the entire application.

- [ ] 8.1 Load `Cormorant_Garamond` (weights 300–700) and `Manrope` (weights 300–800) via `next/font/google`, injecting `--font-serif` and `--font-sans` as CSS variables on `<html>`.
- [ ] 8.2 Import `./globals.css` so the design system is applied globally.
- [ ] 8.3 Wrap `{children}` in `<Providers>` (React Query) and render `<Toaster richColors position="bottom-center" />` from `@/components/ui/sonner`.
- [ ] 8.4 Export a `metadata` constant with `title: "Maison Table"` and a restaurant description.
- [ ] 8.5 Keep the component as a Server Component (no `"use client"` directive).

**Satisfies:** Requirements 3.2, 2.7

---

## Task 9: Customer Routes

Create the `(site)` route group layout and all ten customer-facing pages.

> **IMPORTANT:** Every source route file wraps its content in `<SiteLayout>`. Do NOT copy this wrapper into any page file. The `(site)/layout.tsx` provides the SiteLayout wrapper for all customer pages. Each individual page file must render only its inner page content.

- [ ] 9.1 Create `src/app/(site)/layout.tsx` wrapping pages in the `SiteLayout` component (site header with cart panel, footer).
- [ ] 9.2 Create `src/app/(site)/page.tsx` — homepage with hero, best sellers, chef picks, our story, testimonials, hours, and location sections. Use hydration-safe pattern for any localStorage reads.
- [ ] 9.3 Create `src/app/(site)/menu/page.tsx` — annotate `"use client"`; implement search, category tabs, dietary filter chips, dish grid, and quick-add dialog.
- [ ] 9.4 Create `src/app/(site)/menu/[slug]/page.tsx` — annotate `"use client"`; render dish detail with add-to-cart controls and related dishes section.
- [ ] 9.5 Create `src/app/(site)/cart/page.tsx` — annotate `"use client"`; render cart line items, promo code input, totals, minimum order enforcement, and link to checkout.
- [ ] 9.6 Create `src/app/(site)/checkout/page.tsx` — annotate `"use client"`; render delivery form, COD and simulated online payment options, and order submission.
- [ ] 9.7 Create `src/app/(site)/order/[id]/page.tsx` — annotate `"use client"`; render order confirmation and `OrderTimeline`.
- [ ] 9.8 Create `src/app/(site)/about/page.tsx` — static content page; may be a Server Component.
- [ ] 9.9 Create `src/app/(site)/contact/page.tsx` — annotate `"use client"`; contact form with state.
- [ ] 9.10 Create `src/app/(site)/account/page.tsx` — annotate `"use client"`; add `useEffect` redirect to `/login` when `sessionStore.customer` is `null`; render customer name, email, and session details.
- [ ] 9.11 Create `src/app/(site)/account/orders/page.tsx` — annotate `"use client"`; add `useEffect` redirect to `/login` when `sessionStore.customer` is `null`; render customer's past orders from `sessionStore.myOrders` matched against `dbStore.orders`.

**Satisfies:** Requirements 4.1 – 4.10, 5.1 – 5.4

---

## Task 10: Auth Routes

Create the `(auth)` route group and login/register pages without site navigation.

- [ ] 10.1 Create `src/app/(auth)/layout.tsx` — minimal wrapper with centred card and Maison Table wordmark; no site header or admin sidebar.
- [ ] 10.2 Create `src/app/(auth)/login/page.tsx` — annotate `"use client"`; render `AuthForm` in login mode; writes customer credentials to `sessionStore` on success.
- [ ] 10.3 Create `src/app/(auth)/register/page.tsx` — annotate `"use client"`; render `AuthForm` in register mode matching SourceProject demo localStorage authentication.

**Satisfies:** Requirements 4.7, 3.5

---

## Task 11: Admin Routes

Create the `(admin)` route group layout and all nine admin pages. **Note: None of these admin pages exist in the SourceProject � they must be created from scratch.** The SourceProject has zero admin routes; do not attempt to copy or port from the source.

- [ ] 11.1 Create `src/app/(admin)/layout.tsx` — apply `admin-theme` CSS class to outer wrapper; render `AdminSidebar` Client Component (uses `usePathname` for active links and `sessionStore` for session checks).
- [ ] 11.2 Create `src/components/admin/AdminSidebar.tsx` — annotate `"use client"`; navigation links for all admin pages; `useEffect` redirect to `/admin/login` when `sessionStore.admin` is `null`.
- [ ] 11.3 Create `src/app/(admin)/admin/login/page.tsx` — annotate `"use client"`; email/password form that writes admin credentials to `sessionStore`.
- [ ] 11.4 Create `src/app/(admin)/admin/dashboard/page.tsx` — annotate `"use client"`; summary panel with today's order count, revenue, and pending orders from `dbStore`.
- [ ] 11.5 Create `src/app/(admin)/admin/orders/page.tsx` — annotate `"use client"`; full orders table with status filters, status update controls, and COD collection controls.
- [ ] 11.6 Create `src/app/(admin)/admin/menu/page.tsx` — annotate `"use client"`; menu item management table with add, edit, and delete actions.
- [ ] 11.7 Create `src/app/(admin)/admin/categories/page.tsx` — annotate `"use client"`; category management interface.
- [ ] 11.8 Create `src/app/(admin)/admin/payments/page.tsx` — annotate `"use client"`; payment and promo code management interface.
- [ ] 11.9 Create `src/app/(admin)/admin/analytics/page.tsx` — annotate `"use client"`; recharts-based revenue and order analytics.
- [ ] 11.10 Create `src/app/(admin)/admin/settings/page.tsx` — annotate `"use client"`; restaurant settings form.
- [ ] 11.11 Verify every admin page and layout file carries `"use client"` (Property 4) and that every admin page except `/admin/login` redirects to `/admin/login` when `sessionStore.admin` is `null` (Property 6).

**Satisfies:** Requirements 6.1 – 6.10, 3.4

---

## Task 12: Static Assets

Copy all static files from SourceProject into the NextApp's `public/` and `src/assets/` directories.

- [ ] 12.1 Copy `public/favicon.ico` from SourceProject to `maison-table-nextjs/public/favicon.ico`.
- [ ] 12.2 Copy `public/robots.txt` from SourceProject to `maison-table-nextjs/public/robots.txt`.
- [ ] 12.3 Copy `src/assets/hero.jpg` from SourceProject to `maison-table-nextjs/src/assets/hero.jpg`.
- [ ] 12.4 Copy `src/assets/story.jpg` from SourceProject to `maison-table-nextjs/src/assets/story.jpg`.
- [ ] 12.5 Confirm all local asset images (`hero.jpg`, `story.jpg`) are rendered via `next/image` in their respective page components.

**Satisfies:** Requirements 10.1 – 10.4

---

## Task 13: Custom 404 and Error Pages

Create the app-level not-found and error boundary pages.

- [ ] 13.1 Create `src/app/not-found.tsx` — render a "page not found" message with a "Go home" link to `/`; match the visual style of the SourceProject `NotFoundComponent`.
- [ ] 13.2 Create `src/app/error.tsx` — annotate `"use client"` (required by Next.js for error boundaries); accept `error` and `reset` props; render an error message and a "Try again" button that calls `reset()`.

**Satisfies:** Requirements 3.6, 3.7

---

## Task 14: Build Verification

Run the full build inside `maison-table-nextjs/` and confirm zero TypeScript or compilation errors.

- [ ] 14.1 Run `npm install` inside `maison-table-nextjs/` to install all declared dependencies.
- [ ] 14.2 Run `npm run build` inside `maison-table-nextjs/` and confirm the build exits with code 0.
- [ ] 14.3 Confirm no TypeScript errors are emitted during the build.
- [ ] 14.4 Confirm no forbidden imports are present in any source file (Property 2 — no `@tanstack/react-router` or `@tanstack/react-start`; Property 7 — excluded packages absent from `package.json`).
- [ ] 14.5 Confirm every file that references `localStorage`, `useDB`, `useCart`, `useSession`, or `useSyncExternalStore` carries `"use client"` as its first non-comment line (Property 3).
- [ ] 14.6 Confirm every file in SourceProject (`pixel-perfect-replica-main/`) is byte-for-byte identical to its state before the migration began (Property 8).

**Satisfies:** Requirements 1.7, 1.8
