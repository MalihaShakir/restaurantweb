"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Flame, Star, ArrowRight } from "lucide-react";
import { DishCard } from "@/components/site/DishCard";
import { DishDialog } from "@/components/site/DishDialog";
import { PageHeader } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDB } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { Dietary, MenuItem } from "@/lib/types";
import Link from "next/link";

const DIETS: { value: Dietary; label: string }[] = [
  { value: "vegetarian", label: "🌿 Vegetarian" },
  { value: "vegan", label: "🌱 Vegan" },
  { value: "gluten-free", label: "GF Gluten-free" },
  { value: "dairy-free", label: "DF Dairy-free" },
  { value: "spicy", label: "🌶 Spicy" },
];

function FeaturedBanner({ items }: { items: MenuItem[] }) {
  const featured = items.filter((m) => m.featured && m.available).slice(0, 3);
  if (!featured.length) return null;
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="eyebrow">From the kitchen</p>
          <h2 className="mt-1 text-3xl font-medium">Featured this week</h2>
        </div>
        <Link href="/menu" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:underline">
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {featured.map((item) => (
          <article key={item.id} className="group relative overflow-hidden rounded-2xl shadow-lift">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-scrim" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-cream">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
                {item.chefPick ? "Chef's pick" : "Featured"}
              </p>
              <h3 className="font-display text-2xl font-medium leading-tight">{item.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">{fmt(item.price)}</span>
                <Link
                  href={`/menu/${item.slug}`}
                  className="rounded-full bg-cream/20 px-3 py-1 text-xs font-semibold backdrop-blur transition hover:bg-cream/30"
                >
                  View →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MenuContent() {
  const db = useDB();
  const searchParams = useSearchParams();
  const router = useRouter();
  const c = searchParams.get("c") ?? undefined;
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState<Dietary[]>([]);
  const [open, setOpen] = useState<MenuItem | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);

  const cat = db.categories.find((x) => x.slug === c);

  const allItems = useMemo(
    () => db.menu.filter(
      (m) =>
        (!cat || m.categoryId === cat.id) &&
        (!q || `${m.name} ${m.description}`.toLowerCase().includes(q.toLowerCase())) &&
        diet.every((d) => m.dietary.includes(d)),
    ),
    [db.menu, cat, q, diet],
  );

  // Category counts for badges
  const catCount = useMemo(() => {
    const counts: Record<string, number> = {};
    db.menu.forEach((m) => {
      counts[m.categoryId] = (counts[m.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [db.menu]);

  const isFiltering = !!q || diet.length > 0;
  const showFeatured = !cat && !isFiltering;

  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
      active
        ? "border-espresso bg-espresso text-cream shadow-soft"
        : "border-border bg-card hover:border-terracotta hover:text-terracotta",
    );

  return (
    <>
      <PageHeader eyebrow="Order for delivery" title="The menu">
        Cooked to order, packed with care. ~{db.settings.etaMinutes} min delivery · {db.settings.deliveryRadiusKm} km radius.
      </PageHeader>

      <section className="container-site pb-32">
        {/* Sticky filters */}
        <div className="sticky top-[72px] z-30 -mx-5 space-y-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur md:mx-0 md:px-0">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes, ingredients…"
              aria-label="Search menu"
              className="h-11 rounded-full bg-card pl-11 pr-10"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Filter by category">
            <button
              role="tab"
              aria-selected={!cat}
              className={chip(!cat)}
              onClick={() => router.push("/menu")}
            >
              All
              <span className="ml-1.5 text-[10px] opacity-60">({db.menu.length})</span>
            </button>
            {[...db.categories].sort((a, b) => a.sort - b.sort).map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={cat?.id === x.id}
                className={chip(cat?.id === x.id)}
                onClick={() => router.push(`/menu?c=${x.slug}`)}
              >
                {x.name}
                <span className="ml-1.5 text-[10px] opacity-60">({catCount[x.id] ?? 0})</span>
              </button>
            ))}
          </div>

          {/* Dietary filters */}
          <div className="flex flex-wrap gap-2" aria-label="Dietary filters">
            {DIETS.map(({ value: d, label }) => {
              const on = diet.includes(d);
              return (
                <button
                  key={d}
                  aria-pressed={on}
                  onClick={() => setDiet((p) => (on ? p.filter((x) => x !== d) : [...p, d]))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
                    on
                      ? "border-terracotta bg-terracotta/10 text-terracotta"
                      : "border-border text-muted-foreground hover:border-terracotta/60",
                  )}
                >
                  {label}
                </button>
              );
            })}
            {(diet.length > 0 || q) && (
              <button
                onClick={() => { setQ(""); setDiet([]); router.push("/menu"); }}
                className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/5"
              >
                <X className="size-3" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Featured banner — shown only on "All" with no filters */}
        {showFeatured && ready && <div className="mt-10"><FeaturedBanner items={db.menu} /></div>}

        {/* Popular / bestsellers strip */}
        {showFeatured && ready && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="size-4 text-gold fill-gold" />
              <h2 className="text-xl font-semibold">Most popular</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {db.menu.filter((m) => m.bestSeller && m.available).slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setOpen(item)}
                  className="group shrink-0 flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-terracotta hover:shadow-soft"
                >
                  <img src={item.image} alt={item.name} className="size-12 rounded-lg object-cover" loading="lazy" />
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chef's picks section */}
        {showFeatured && ready && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="size-4 text-terracotta" />
              <h2 className="text-xl font-semibold">Chef&apos;s picks</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {db.menu.filter((m) => m.chefPick && m.available).slice(0, 3).map((m) => (
                <DishCard key={m.id} item={m} onOpen={setOpen} />
              ))}
            </div>
          </div>
        )}

        {/* Main grid */}
        {!ready ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          </div>
        ) : allItems.length === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-muted">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <p className="font-display text-3xl">Nothing matches that</p>
            <p className="text-muted-foreground">Try a different search or remove some filters.</p>
            <button
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              onClick={() => { setQ(""); setDiet([]); router.push("/menu"); }}
            >
              <X className="size-4" /> Clear all filters
            </button>
          </div>
        ) : (
          <>
            {(isFiltering || cat) && (
              <p className="mt-4 mb-6 text-sm text-muted-foreground">
                {allItems.length} {allItems.length === 1 ? "dish" : "dishes"}
                {cat ? ` in ${cat.name}` : ""}
                {q ? ` matching "${q}"` : ""}
              </p>
            )}
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allItems.map((m) => <DishCard key={m.id} item={m} onOpen={setOpen} />)}
            </div>
          </>
        )}
      </section>

      <DishDialog item={open} onClose={() => setOpen(null)} />
    </>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="container-site py-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
