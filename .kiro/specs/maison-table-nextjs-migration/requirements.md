# Requirements Document

## Introduction

Migrate the Maison Table restaurant website from TanStack Start/Vite to a Next.js 15 App Router project deployable on Vercel. The migration produces a new `maison-table-nextjs/` directory alongside the original project (which remains untouched). All ten existing customer-facing routes are re-implemented with identical UI, behavior, and design system. Two new customer routes (`/account` and `/account/orders`) and nine admin routes (`/admin/login`, `/admin/dashboard`, `/admin/orders`, `/admin/menu`, `/admin/categories`, `/admin/payments`, `/admin/analytics`, `/admin/settings`) are scaffolded. The data layer remains localStorage-based for the browser; server-side libraries (NextAuth v5, Mongoose, Stripe) are scaffolded with environment variable placeholders but not wired to real external services.

## Glossary

- **MigrationSystem**: The automated migration tooling and processes responsible for creating the `maison-table-nextjs/` project.
- **NextApp**: The output Next.js 15 App Router project located at `maison-table-nextjs/` within the workspace.
- **SourceProject**: The existing TanStack Start/Vite project at `pixel-perfect-replica-main/` that must remain unmodified.
- **AppRouter**: The Next.js 15 `app/` directory file-system routing convention using Server and Client Components.
- **DesignSystem**: The complete set of Tailwind CSS v4 custom properties, utility classes, fonts, and color tokens defined in `styles.css` of the SourceProject.
- **LocalStorageLayer**: The browser-side data persistence implemented via `dbStore`, `cartStore`, and `sessionStore` in `src/lib/store.ts` of the SourceProject.
- **ScaffoldedLibrary**: A library added to `package.json` and configured with environment variable placeholders but not connected to live external services.
- **ClientComponent**: A Next.js component file annotated with `"use client"` that runs in the browser.
- **ServerComponent**: A Next.js component that runs only on the server (default in the AppRouter).
- **AdminTheme**: The `.admin-theme` CSS class with a cooler neutral palette applied to all admin routes.
- **RouteGroup**: A Next.js App Router parenthesised folder `(group)` that shares a layout without adding a URL segment.
- **SeedData**: The deterministic initial dataset produced by `buildSeed()` in `src/lib/seed.ts`, covering categories, menu items, orders, promotions, staff, settings, and notifications.

## Requirements

### Requirement 1: Project Scaffold and Dependency Configuration

**User Story:** As a developer, I want a correctly configured Next.js 15 project directory, so that the migration compiles and runs locally and deploys to Vercel without manual package fixes.

#### Acceptance Criteria

1. THE MigrationSystem SHALL create a `maison-table-nextjs/` directory at the workspace root containing a valid Next.js 15 App Router project with TypeScript 5.8 and React 19.
2. THE NextApp SHALL include a `package.json` that lists `next@15`, `react@19`, `react-dom@19`, and all required UI libraries from the SourceProject: `@radix-ui/*`, `sonner`, `lucide-react`, `recharts`, `date-fns`, `react-hook-form`, `zod`, `@tanstack/react-query`, `class-variance-authority`, `tailwind-merge`, `clsx`, `embla-carousel-react`, `react-day-picker`, `react-resizable-panels`, `vaul`, `cmdk`, `input-otp`.
3. THE NextApp SHALL include `next-auth@5`, `mongoose`, `stripe`, and `@stripe/react-stripe-js` in `package.json` as ScaffoldedLibraries.
4. THE NextApp SHALL NOT include `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@tailwindcss/vite`, `@lovable.dev/vite-tanstack-config`, `vite`, `nitro`, or `tw-animate-css` in `package.json`.
5. THE NextApp SHALL include a `next.config.ts` that enables React 19 compatibility and configures the `images` domain list to allow `images.unsplash.com`.
6. THE NextApp SHALL include a `tsconfig.json` with `"paths": { "@/*": ["./src/*"] }` path alias matching the SourceProject convention.
7. WHEN a developer runs `npm run build` in `maison-table-nextjs/`, THE NextApp SHALL complete the build without TypeScript or compilation errors.
8. THE MigrationSystem SHALL leave every file in `pixel-perfect-replica-main/` unmodified.

### Requirement 2: Tailwind CSS v4 and Design System Preservation

**User Story:** As a designer, I want the exact color tokens, typography, shadows, and custom utilities from the original project reproduced in the Next.js project, so that no visual regressions appear in any migrated page.

#### Acceptance Criteria

1. THE NextApp SHALL configure Tailwind CSS v4 using `@tailwindcss/postcss` in `postcss.config.mjs` instead of the Vite plugin.
2. THE NextApp SHALL include a global CSS file that reproduces every CSS custom property from the SourceProject `styles.css`, including `--espresso`, `--cream`, `--beige`, `--terracotta`, `--gold`, `--success`, `--warning`, `--info`, all semantic tokens (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`), all chart tokens, and all sidebar tokens.
3. THE NextApp global CSS SHALL define the `--shadow-soft`, `--shadow-lift`, and `--gradient-scrim` custom properties with the same `oklch` values as the SourceProject.
4. THE NextApp global CSS SHALL define the `@utility` blocks for `shadow-soft`, `shadow-lift`, `bg-scrim`, `eyebrow`, and `container-site` with identical rules to the SourceProject.
5. THE NextApp global CSS SHALL define the `@keyframes reveal-up` animation and the `@utility reveal` class with the same cubic-bezier timing as the SourceProject.
6. THE NextApp global CSS SHALL include the `AdminTheme` block (`.admin-theme { … }`) with the same cooler neutral palette overrides as the SourceProject.
7. THE NextApp SHALL load the `Cormorant Garamond` and `Manrope` Google Fonts with the same weights as the SourceProject via `next/font/google` or equivalent `<link>` preconnect tags in the root layout.
8. THE NextApp global CSS SHALL apply `--font-serif` to `h1`, `h2`, `h3`, and `.font-display` selectors, and `--font-sans` to the body, matching the SourceProject typographic base rules.
9. THE NextApp SHALL NOT import `tw-animate-css`; all required keyframes SHALL be defined inline in the global CSS file.
10. THE NextApp global CSS SHALL include the `@media (prefers-reduced-motion: reduce)` block that sets `animation-duration` and `transition-duration` to `0.01ms`.

### Requirement 3: App Router Directory Structure and Layouts

**User Story:** As a developer, I want a well-organized App Router directory that mirrors the original routing hierarchy with proper layouts and route groups, so that each page gets the correct shell, navigation, and theme without duplicating markup.

#### Acceptance Criteria

1. THE NextApp SHALL place all App Router files under `src/app/` and all reusable components under `src/components/`.
2. THE NextApp SHALL define a root layout at `src/app/layout.tsx` that renders the HTML shell with the global CSS import, font preconnect tags, React Query provider, Toaster, and metadata defaults for Maison Table.
3. THE NextApp SHALL define a `(site)` RouteGroup with its own layout at `src/app/(site)/layout.tsx` that wraps pages in the `SiteLayout` component (header with cart panel, footer).
4. THE NextApp SHALL define an `(admin)` RouteGroup with its own layout at `src/app/(admin)/layout.tsx` that applies the `AdminTheme` CSS class and renders the admin sidebar navigation.
5. THE NextApp SHALL define an `(auth)` RouteGroup at `src/app/(auth)/` for the `/login` and `/register` pages, rendered without the site navigation or admin sidebar.
6. WHEN a request is made to a URL that does not match any defined route, THE NextApp SHALL render a custom 404 page via `src/app/not-found.tsx` with a "Go home" link matching the SourceProject's NotFoundComponent.
7. IF an unhandled error occurs during rendering, THEN THE NextApp SHALL display a custom error boundary via `src/app/error.tsx` with a "Try again" button.

### Requirement 4: Customer-Facing Route Migration

**User Story:** As a customer, I want every existing page of the Maison Table website to work identically in the Next.js version, so that I can browse the menu, manage my cart, and place orders without any disruption.

#### Acceptance Criteria

1. THE NextApp SHALL implement the `/` route at `src/app/(site)/page.tsx` rendering the full homepage sections: hero, best sellers, chef picks, our story, testimonials, hours, and location — matching the SourceProject `src/routes/index.tsx` layout and content.
2. THE NextApp SHALL implement the `/menu` route at `src/app/(site)/menu/page.tsx` with search filtering, category tabs, dietary filter chips, lazy-loaded dish grid, and quick-add dialog matching the SourceProject `src/routes/menu.index.tsx`.
3. THE NextApp SHALL implement the `/menu/[slug]` route at `src/app/(site)/menu/[slug]/page.tsx` rendering an individual dish detail view with add-to-cart controls and a related dishes section matching the SourceProject `src/routes/menu.$slug.tsx`.
4. THE NextApp SHALL implement the `/cart` route at `src/app/(site)/cart/page.tsx` rendering the cart line items, promo code input, totals, minimum order enforcement, and navigation to checkout matching the SourceProject `src/routes/cart.tsx`.
5. THE NextApp SHALL implement the `/checkout` route at `src/app/(site)/checkout/page.tsx` rendering the delivery form, cash-on-delivery and simulated online payment options, and order submission flow matching the SourceProject `src/routes/checkout.tsx`.
6. THE NextApp SHALL implement the `/order/[id]` route at `src/app/(site)/order/[id]/page.tsx` rendering the order confirmation and timeline matching the SourceProject `src/routes/order.$id.tsx`.
7. THE NextApp SHALL implement the `/login` route at `src/app/(auth)/login/page.tsx` and the `/register` route at `src/app/(auth)/register/page.tsx` matching the SourceProject demo localStorage authentication forms.
8. THE NextApp SHALL implement the `/about` route at `src/app/(site)/about/page.tsx` and the `/contact` route at `src/app/(site)/contact/page.tsx` as full content pages linked from the site navigation.
9. WHEN a ClientComponent needs to read or write the LocalStorageLayer, THE NextApp SHALL annotate that component with `"use client"` and access `localStorage` only after mount to avoid Next.js hydration mismatches.
10. THE NextApp SHALL preserve all interactive behaviors of the SourceProject: cart open/close via `maison:open-cart` custom event, scroll-based header transparency, mobile navigation drawer, and promo code validation.

### Requirement 5: Account and Customer Order History Routes

**User Story:** As a customer, I want an account page and an order history page, so that I can view my profile information and past orders from a single authenticated section.

#### Acceptance Criteria

1. THE NextApp SHALL implement the `/account` route at `src/app/(site)/account/page.tsx` rendering the customer's name, email, and session details from the LocalStorageLayer.
2. THE NextApp SHALL implement the `/account/orders` route at `src/app/(site)/account/orders/page.tsx` rendering a list of the customer's past orders sourced from `sessionStore.myOrders` matched against `dbStore.orders`.
3. WHEN a visitor accesses `/account` or `/account/orders` without a customer session in localStorage, THE NextApp SHALL redirect the visitor to `/login`.
4. THE NextApp SHALL render both account routes within the `(site)` RouteGroup so the site header and footer are present.

### Requirement 6: Admin Route Scaffolding

**User Story:** As a restaurant operator, I want a complete admin section scaffolded in the Next.js project, so that the routes, layouts, and component shells are ready for backend wiring without needing structural refactoring later.

#### Acceptance Criteria

1. THE NextApp SHALL implement `/admin/login` at `src/app/(admin)/admin/login/page.tsx` rendering an email/password form that writes admin credentials to the LocalStorageLayer session, matching the admin login pattern from the SourceProject.
2. THE NextApp SHALL implement `/admin/dashboard` at `src/app/(admin)/admin/dashboard/page.tsx` rendering a summary panel with today's order count, revenue, and pending orders sourced from the LocalStorageLayer.
3. THE NextApp SHALL implement `/admin/orders` at `src/app/(admin)/admin/orders/page.tsx` rendering the full orders table with status filters, status update controls, and COD collection controls from the SourceProject admin.
4. THE NextApp SHALL implement `/admin/menu` at `src/app/(admin)/admin/menu/page.tsx` rendering the menu item management table with add, edit, and delete actions from the SourceProject admin.
5. THE NextApp SHALL implement `/admin/categories` at `src/app/(admin)/admin/categories/page.tsx` rendering the category management interface from the SourceProject admin.
6. THE NextApp SHALL implement `/admin/payments` at `src/app/(admin)/admin/payments/page.tsx` rendering the payment and promo code management interface from the SourceProject admin.
7. THE NextApp SHALL implement `/admin/analytics` at `src/app/(admin)/admin/analytics/page.tsx` rendering the recharts-based revenue and order analytics from the SourceProject admin.
8. THE NextApp SHALL implement `/admin/settings` at `src/app/(admin)/admin/settings/page.tsx` rendering the restaurant settings form from the SourceProject admin.
9. ALL admin pages SHALL be rendered as ClientComponents (annotated `"use client"`) because all admin data is read and written via the LocalStorageLayer.
10. WHEN a visitor accesses any admin route except `/admin/login` without an admin session in localStorage, THE NextApp SHALL redirect the visitor to `/admin/login`.

### Requirement 7: Shared Component and Library Migration

**User Story:** As a developer, I want all reusable components and library modules from the source project ported to the Next.js project, so that no bespoke logic or UI needs to be rewritten from scratch.

#### Acceptance Criteria

1. THE NextApp SHALL include a `src/components/ui/` directory containing all shadcn/ui Radix components from the SourceProject (`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `tooltip`).
2. THE NextApp SHALL include `src/components/site/` containing `SiteLayout.tsx`, `AuthForm.tsx`, `CartPanel.tsx`, `DishCard.tsx`, `DishDialog.tsx`, `QtyStepper.tsx` and `OrderTimeline.tsx` ported from the SourceProject with TanStack Router imports replaced by `next/link` and `next/navigation`.
3. THE NextApp SHALL include `src/lib/types.ts` with the identical TypeScript interfaces and types as the SourceProject.
4. THE NextApp SHALL include `src/lib/store.ts` with the identical `createStore`, `dbStore`, `cartStore`, `sessionStore`, `cart`, `repo`, `useDB`, `useCart`, `useSession`, and `useCartSummary` implementations.
5. THE NextApp SHALL include `src/lib/seed.ts`, `src/lib/pricing.ts`, `src/lib/status.ts`, `src/lib/brand.ts`, and `src/lib/utils.ts` copied from the SourceProject without modification.
6. THE NextApp SHALL include `src/hooks/use-mobile.tsx` copied from the SourceProject.
7. WHEN any ported component references a TanStack Router import (`@tanstack/react-router`), THE NextApp SHALL replace `Link` with `next/link`, `useNavigate` with `useRouter` from `next/navigation`, and route-level `loader` data with direct LocalStorageLayer reads.
8. THE NextApp SHALL include a `src/components/badges.tsx` file ported from the SourceProject.

### Requirement 8: Scaffolded Backend Libraries

**User Story:** As a developer, I want NextAuth, Mongoose, and Stripe scaffolded with environment variable placeholders, so that connecting to real services requires only filling in environment variables and wiring the adapters, not restructuring the project.

#### Acceptance Criteria

1. THE NextApp SHALL include a `.env.local.example` file listing all required environment variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL`.
2. THE NextApp SHALL include a `src/lib/auth.ts` file that scaffolds a NextAuth v5 `auth()` configuration with a `CredentialsProvider` stub and placeholder MongoDB adapter comment.
3. THE NextApp SHALL include a `src/lib/db.ts` file that scaffolds a Mongoose connection helper using the `MONGODB_URI` environment variable with a connection caching pattern suitable for Next.js serverless functions.
4. THE NextApp SHALL include a `src/lib/stripe.ts` file that exports an initialized Stripe instance using the `STRIPE_SECRET_KEY` environment variable.
5. THE NextApp SHALL include a `src/app/api/auth/[...nextauth]/route.ts` file that exports the NextAuth v5 route handlers.
6. WHERE Stripe is enabled, THE NextApp SHALL include a `src/app/api/checkout/route.ts` stub that accepts a POST request and returns a placeholder payment intent response, ready to be wired to a real Stripe call.
7. THE NextApp SHALL NOT make any live network requests to MongoDB, Stripe, or auth providers during a local `npm run dev` when environment variables are absent or set to placeholder values.

### Requirement 9: Vercel Deployment Configuration

**User Story:** As a developer, I want the Next.js project to be deployable on Vercel with a single push, so that environment variables and build settings require no manual Vercel dashboard changes beyond entering secret values.

#### Acceptance Criteria

1. THE NextApp SHALL include a `vercel.json` that sets the build command to `npm run build` and the output directory to `.next`.
2. THE NextApp SHALL include a `README.md` that documents the required environment variables, local development steps (`npm install`, `npm run dev`), and Vercel deployment steps.
3. WHEN the Next.js build runs on Vercel without any environment variables set, THE NextApp SHALL produce a successful static build without crashing, because all ScaffoldedLibraries gracefully handle missing environment variables.
4. THE NextApp `next.config.ts` SHALL set `output` mode compatible with Vercel's Node.js runtime (default, not `"export"`) so that API routes and Server Components function correctly.

### Requirement 10: Asset and Static File Migration

**User Story:** As a developer, I want all static assets from the source project copied to the Next.js project, so that hero images and story images render correctly.

#### Acceptance Criteria

1. THE NextApp SHALL include a `public/` directory containing `favicon.ico` and `robots.txt` copied from the SourceProject `public/` directory.
2. THE NextApp SHALL include `src/assets/hero.jpg` and `src/assets/story.jpg` copied from the SourceProject `src/assets/` directory.
3. WHEN an image from `images.unsplash.com` is rendered via `next/image`, THE NextApp `next.config.ts` SHALL list `images.unsplash.com` as a permitted `remotePatterns` hostname so the image optimization pipeline does not block the request.
4. THE NextApp SHALL use `next/image` for all local asset images (`hero.jpg`, `story.jpg`) and may use standard `<img>` tags for external Unsplash URLs if `next/image` remotePatterns configuration is in place.
