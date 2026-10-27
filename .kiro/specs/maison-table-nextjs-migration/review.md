# Design Review — maison-table-nextjs-migration

**Reviewer:** Kiro design-review agent  
**Reviewed:** `requirements.md`, `design.md`, `tasks.md`  
**Source verified against:** `pixel-perfect-replica-main/` codebase

---

## Findings

### HIGH

**1. Admin routes do not exist in the source project — the design misrepresents them as ports.**

*Where:* design.md §"Admin Components", tasks.md Task 11 and Task 5 header, requirements.md §6 ("ported from SourceProject admin").

*Problem:* The design and requirements repeatedly say admin pages are "ported from the SourceProject admin." Verification shows the source project has **zero admin routes** — `src/routes/` contains only `index.tsx`, `login.tsx`, `register.tsx`, `menu.index.tsx`, `menu.$slug.tsx`, `cart.tsx`, `checkout.tsx`, and `order.$id.tsx`. There are no `admin/` files anywhere in the project. Every admin page (dashboard, orders, menu management, categories, payments, analytics, settings) must be built from scratch.

*Impact:* This affects scope estimates, the component inventory, and task difficulty. A task that says "copy and port" is trivially executable; a task that says "design and build from scratch" is a significant feature. The coder will discover this when they try to copy files that don't exist.

*Fix:* Rewrite every admin-page task (11.3–11.10, and the referenced admin components in §"Admin Components") to say "create from scratch matching the requirements description" rather than "port from SourceProject." Remove all references to "from the SourceProject admin" in requirements §6.1–6.8 and design §"Admin Components."

---

**2. `AuthForm` embeds `SiteLayout` internally — design's auth route group will produce a double-wrapped layout.**

*Where:* design.md §"Auth Layout", tasks.md Task 10, requirements.md §3.5 and §4.7.

*Problem:* The actual `AuthForm.tsx` in the source project wraps its own output in `<SiteLayout>`. The spec defines an `(auth)` route group specifically to render those pages **without** site navigation, but if `AuthForm` is ported verbatim (as Task 5.6 says), the `SiteLayout` inside it will conflict with the `(auth)` layout wrapper. The result will be either a double-layout or a missing layout, depending on how the port is handled.

*Fix:* Explicitly state in Task 5.6 that the `SiteLayout` wrapper must be **removed from `AuthForm`** during porting. The `(auth)` route group layout provides the centred-card chrome; `AuthForm` should render only the form. This is a required deviation from verbatim copy.

---

### MEDIUM

**3. `store.ts` `subscribe()` calls `window.addEventListener` unconditionally — the design's SSR-safety claim is incomplete.**

*Where:* design.md §"Data Flow" ("The existing `typeof window === 'undefined'` guard … makes `useSyncExternalStore` safe to call in both Server and Client Components").

*Problem:* Verification shows `subscribe()` calls `window.addEventListener` directly on the first line with no SSR guard. `useSyncExternalStore` passes `subscribe` as its first argument; Next.js does call the subscribe function during server rendering to check for teardown, but more importantly — if any component tries to call `store.subscribe` during SSR it will throw `ReferenceError: window is not defined`. The design says the guard makes the store "safe to call in both Server and Client Components," which overstates the safety. The design then immediately contradicts itself by saying "all store-reading components must be Client Components." The second sentence is correct; the first is wrong and could mislead the coder into omitting a `"use client"` directive somewhere.

*Fix:* Remove the claim that `createStore` is safe in Server Components. Replace with: "`createStore` returns `serverState` when `typeof window === 'undefined'` so the initial snapshot is safe, but `subscribe` accesses `window` directly — every component that calls `useDB()`, `useCart()`, or `useSession()` **must** be a Client Component." Optionally add a `typeof window === 'undefined'` guard inside `subscribe` in the ported `store.ts`.

---

**4. Menu page uses `Route.useSearch()` (TanStack Router) and `Route.useNavigate()` — the design's import replacement table is incomplete.**

*Where:* design.md §"Site Components" import replacement table, tasks.md Task 5.

*Problem:* The source `menu.index.tsx` uses `Route.useSearch()` and `Route.useNavigate()` — both are TanStack Router-specific APIs with no direct Next.js equivalent listed in the design. `useSearch` reads typed search params; the Next.js equivalent is `useSearchParams()` from `next/navigation` (requires `Suspense` wrapping). `Route.useNavigate()` becomes `useRouter()` but the call signature changes from `navigate({ search: { c: "starters" } })` to `router.push("/menu?c=starters")`. The design's table only covers `Link`, `useNavigate`, and `loader` data — it misses this pattern entirely.

*Fix:* Add two rows to the replacement table:

| SourceProject | NextApp |
|---|---|
| `Route.useSearch()` | `useSearchParams()` from `next/navigation` (wrap page in `<Suspense>`) |
| `Route.useNavigate()` (search param update) | `useRouter()` + manually build the query string, or `useRouter().push(\`/menu?c=${slug}\`)` |

Add a note that `useSearchParams()` requires the page to be wrapped in `<Suspense>` per Next.js 15 App Router rules, otherwise the build will warn/fail.

---

**5. `(site)` layout wraps pages in `SiteLayout`, but several existing route files also render `SiteLayout` directly — the design creates a double-layout risk for ported pages.**

*Where:* design.md §"Site Layout", tasks.md Task 9 (all page tasks).

*Problem:* Every source route file (`index.tsx`, `checkout.tsx`, `menu.index.tsx`, `login.tsx`, etc.) wraps its content in `<SiteLayout>`. The design moves `SiteLayout` into the `(site)` layout file so individual pages don't need it. But Task 5's instruction is to port the site components and Task 9 says to port the page content — if any page is ported verbatim it will include its own `<SiteLayout>` call, double-wrapping the header and footer.

*Fix:* Add an explicit callout in Task 9 (and a note in design.md §"Customer Routes"): "Do NOT copy the `<SiteLayout>` wrapper from each source route. The `(site)/layout.tsx` provides this wrapper; each page file should render only its inner content." This is a different failure mode from Finding 2 but the same root cause.

---

**6. The `Toaster` position differs between source and design.**

*Where:* design.md §"Root Layout" code snippet (`position="top-right"`), source `__root.tsx` (`position="bottom-center"`).

*Problem:* A small but verified visual discrepancy. The spec requires pixel-level fidelity (overview paragraph: "reproduces every customer-facing page at pixel-level fidelity"). The source uses `bottom-center`; the design hardcodes `top-right`.

*Fix:* Change the `Toaster` position in the root layout snippet from `position="top-right"` to `position="bottom-center"` to match the source.

---

**7. `next-auth@5` API in the scaffold may conflict with the listed package — the version specifier is ambiguous.**

*Where:* design.md §"Authentication (Scaffolded)", tasks.md Task 1.1.

*Problem:* NextAuth v5 (Auth.js) is currently published under the package name `next-auth` at `5.0.0-beta.*`, but the stable v5 GA is also `next-auth@5`. The design shows `import NextAuth from "next-auth"` and `import Credentials from "next-auth/providers/credentials"` which is the v5 API. However, Task 1.1 says `next-auth@5` as the version specifier. If the npm registry resolves this to a pre-release beta it may install a different API surface than expected. Additionally, NextAuth v5 requires `NEXTAUTH_SECRET` to be set even in dev — without it the server throws at startup, which conflicts with Requirement 8.7 ("SHALL NOT make live requests when env vars are absent").

*Fix:* Pin to an exact stable version (`next-auth@5.0.0` or the latest known stable). Add a note in Task 7.1 that `NEXTAUTH_SECRET` must be set to any non-empty string in `.env.local` for local dev to start without errors — this is a developer UX requirement, not a security gap.

---

**8. `resizable.tsx` is in the source project but absent from the Task 4.1 copy list.**

*Where:* tasks.md Task 4.1, source `src/components/ui/resizable.tsx`.

*Problem:* The source project contains `components/ui/resizable.tsx` (wraps `react-resizable-panels`). It is not listed in the Task 4.1 copy list, which means it will be silently omitted. If any admin component (e.g. a split-pane layout) uses it, the build will fail.

*Fix:* Add `resizable` to the Task 4.1 component list.

---

**9. `toast.tsx` is listed in Task 4.1 but `toast` in shadcn/ui for Tailwind v4 projects is typically replaced by `sonner` — source project has no `toast.tsx`.**

*Where:* tasks.md Task 4.1.

*Problem:* The source project does not have a `toast.tsx` file in `src/components/ui/` (verified by directory listing). It uses `sonner` via `sonner.tsx`. If Task 4.1 tries to copy `toast.tsx` from the source it will fail silently or produce a missing file. More importantly if the coder creates a `toast.tsx` from scratch (old shadcn toast component) and some component imports from `@/components/ui/toast`, there will be a conflict with the `sonner`-based `Toaster`.

*Fix:* Remove `toast` from the Task 4.1 list and add a note: "The source project uses `sonner` for notifications; `toast.tsx` does not exist in the source and should not be created."

---

**10. Unspecified behavior when `store.ts` is ported: `subscribe` will throw on server if called during SSR.**

*Where:* design.md §"Data Flow", tasks.md Task 3.2.

*Problem:* Task 3.2 says to copy `store.ts` "verbatim" and that "the existing guard makes it safe for Next.js SSR without modification." This is incorrect (see Finding 3). In practice, if Next.js ever calls `subscribe` during streaming SSR (it may, depending on component tree), it will throw `window is not defined`.

*Fix:* Task 3.2 should say: "Copy `store.ts` with one modification: add a `typeof window === 'undefined'` guard at the top of the `subscribe` function to prevent `window.addEventListener` from being called on the server." Provide the patched snippet in the task or design.

---

### NIT

**11. Design claims font weights "300–700" for `Cormorant_Garamond` but source uses `ital,wght@0,400;0,500;0,600;1,500` — only 4 specific weights, not a range.**

*Where:* design.md §"Root Layout" code snippet, source `__root.tsx` `<link>` tag.

*Impact:* Loading extra weights (300, 700) increases network payload. No functional breakage. The design also omits the italic variant (`1,500`) the source loads.

*Fix:* Replace `weight: ["300", "400", "500", "600", "700"]` with `weight: ["400", "500", "600"]` and add `style: ["normal", "italic"]` to `Cormorant_Garamond` options to match the source.

---

**12. `error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` exist in source lib but are not mentioned in the copy list.**

*Where:* tasks.md Task 3.4.

*Impact:* These are Lovable/Vite-specific utilities. They should NOT be ported to the Next.js project. The design correctly omits them, but the tasks don't explicitly call this out, which could lead a coder to copy them accidentally.

*Fix:* Add a line to Task 3.4: "Do NOT copy `error-capture.ts`, `error-page.ts`, or `lovable-error-reporting.ts` — these are Lovable/Vite infrastructure files with no Next.js equivalent."

---

**13. `@custom-variant dark` directive in source `styles.css` is not mentioned in the design.**

*Where:* design.md §"Global CSS" structure outline, tasks.md Task 2.

*Impact:* The source CSS contains `@custom-variant dark (&:is(.dark *))`. If this line is omitted in the NextApp globals, any component that uses the `dark:` Tailwind variant will silently produce no output. None of the current components appear to use dark-mode classes, but the omission is a hidden divergence.

*Fix:* Add `@custom-variant dark (&:is(.dark *));` to the design's `globals.css` structure outline and Task 2.1.

---

## Verified Assumptions

- ✅ `createStore` checks `typeof window === "undefined"` and returns `serverState` for `get()` calls on the server. (Verified: `store.ts` lines 12–16)
- ✅ Three localStorage keys: `maison-db-v1`, `maison-cart-v1`, `maison-session-v1`. (Verified: `store.ts`)
- ✅ `SiteLayout` listens to `maison:open-cart` custom event and scroll position. (Verified: `SiteLayout.tsx`)
- ✅ `useNavigate` and `Link` from `@tanstack/react-router` are used in `SiteLayout`, `AuthForm`, `CartPanel`, `DishCard`. (Verified: all four files)
- ✅ Tailwind v4 via `@tailwindcss/vite` in source; `@tailwindcss/postcss` is the correct Next.js equivalent. (Verified: `package.json`, `styles.css`)
- ✅ `Cormorant_Garamond` and `Manrope` fonts are loaded from Google Fonts in source. (Verified: `__root.tsx`)
- ✅ `tw-animate-css` is a dependency in source `package.json` and must be excluded from NextApp. (Verified)
- ✅ `@lovable.dev/vite-tanstack-config` is a devDependency in source and must be excluded. (Verified)
- ✅ `resizable.tsx` exists in source `src/components/ui/` but is missing from Task 4.1 list. (Verified)
- ✅ Source `Toaster` uses `position="bottom-center"`, not `"top-right"`. (Verified: `__root.tsx`)
- ✅ `@tanstack/react-query` is a runtime dependency (not just dev) in the source. (Verified: `package.json`)

---

## Unverified / Wrong Assumptions

- ❌ **"Admin pages are ported from SourceProject admin"** — The source has no admin routes at all. (Findings 1)
- ❌ **"`createStore` is safe to call in both Server and Client Components"** — Only `get()` is safe; `subscribe` calls `window.addEventListener` with no guard. (Finding 3, 10)
- ❌ **"`AuthForm` has no layout wrapper"** — Source `AuthForm.tsx` wraps its return in `<SiteLayout>`. (Finding 2)
- ❌ **"Route-level data via `loader`"** — Source routes use `Route.useSearch()` and `Route.useNavigate()` for search-param state, not just `loader`. (Finding 4)
- ❌ **"`toast.tsx` exists in source `src/components/ui/`"** — It does not; the source uses `sonner.tsx`. (Finding 9)

---

## Verdict

**CHANGES_REQUESTED**

| Severity | Count |
|---|---|
| HIGH | 2 |
| MEDIUM | 8 |
| NIT | 3 |

Three findings are blocking-class problems that will cause either a runtime defect (double-layout, SSR crash) or a build failure (missing files to "port"). The admin-routes scope misrepresentation (Finding 1) affects every admin task. All HIGH and MEDIUM findings must be resolved before implementation begins.
