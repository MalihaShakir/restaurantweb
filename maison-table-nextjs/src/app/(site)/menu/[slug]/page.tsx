"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Star, Flame, Leaf } from "lucide-react";
import { AddToOrder } from "@/components/site/DishDialog";
import { DishCard } from "@/components/site/DishCard";
import { DietTag } from "@/components/badges";
import { useDB } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { cn } from "@/lib/utils";

const dietInfo: Record<string, { icon: string; label: string; color: string }> = {
  vegetarian:   { icon: "🌿", label: "Vegetarian",  color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  vegan:        { icon: "🌱", label: "Vegan",        color: "text-green-700 bg-green-50 border-green-200" },
  "gluten-free":{ icon: "✓",  label: "Gluten-free", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "dairy-free": { icon: "✓",  label: "Dairy-free",  color: "text-sky-700 bg-sky-50 border-sky-200" },
  spicy:        { icon: "🌶", label: "Spicy",        color: "text-red-700 bg-red-50 border-red-200" },
};

export default function DishPage({ params }: { params: Promise<{ slug: string }> }) {
  const db = useDB();
  const { slug } = use(params);
  const item = db.menu.find((m) => m.slug === slug);

  if (!item)
    return (
      <div className="container-site py-32 text-center">
        <p className="text-6xl mb-4">🍽</p>
        <h1 className="font-display text-5xl font-medium">Dish not found</h1>
        <p className="mt-3 text-muted-foreground">It may have left the menu this season.</p>
        <Link href="/menu" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
          ← Back to menu
        </Link>
      </div>
    );

  const cat = db.categories.find((c) => c.id === item.categoryId);
  const more = db.menu
    .filter((m) => m.categoryId === item.categoryId && m.id !== item.id && m.available)
    .slice(0, 3);

  return (
    <div className="container-site py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/menu" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" /> Menu
        </Link>
        {cat && (
          <>
            <span>/</span>
            <Link href={`/menu?c=${cat.slug}`} className="hover:text-foreground transition-colors">
              {cat.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium">{item.name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid gap-10 md:grid-cols-2 md:gap-16 lg:gap-20">
        {/* Image */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl shadow-lift aspect-square">
            <img
              src={item.image}
              alt={item.name}
              className="size-full object-cover"
            />
          </div>
          {/* Badges on image */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {item.chefPick && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta shadow-soft">
                <Flame className="size-3" /> Chef&apos;s pick
              </span>
            )}
            {item.bestSeller && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-espresso shadow-soft">
                <Star className="size-3 fill-current" /> Popular
              </span>
            )}
          </div>
          {!item.available && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-espresso/60">
              <span className="rounded-full bg-card px-6 py-2 text-sm font-semibold text-foreground shadow-soft">
                Sold out today
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5 md:py-4">
          {cat && (
            <Link href={`/menu?c=${cat.slug}`} className="eyebrow hover:text-terracotta/80 transition-colors">
              {cat.name}
            </Link>
          )}

          <h1 className="font-display text-5xl font-medium leading-tight md:text-6xl">{item.name}</h1>

          <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>

          {/* Dietary info */}
          {item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.dietary.map((d) => {
                const info = dietInfo[d];
                return info ? (
                  <span key={d} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", info.color)}>
                    <span>{info.icon}</span> {info.label}
                  </span>
                ) : (
                  <DietTag key={d} d={d} />
                );
              })}
            </div>
          )}

          {/* Meta strip */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-y border-border py-4">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-gold" /> ~40 min delivery
            </span>
            {item.dietary.includes("vegetarian") && (
              <span className="flex items-center gap-1.5">
                <Leaf className="size-4 text-emerald-600" /> Vegetarian-friendly
              </span>
            )}
            {item.chefPick && (
              <span className="flex items-center gap-1.5">
                <Flame className="size-4 text-terracotta" /> Recommended by Chef Marco
              </span>
            )}
          </div>

          {/* Price */}
          <p className="font-display text-5xl font-medium">{fmt(item.price)}</p>

          {/* Add to order */}
          <div className="mt-2">
            <AddToOrder item={item} />
          </div>

          {/* Continue shopping */}
          <Link
            href="/menu"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Continue shopping
          </Link>
        </div>
      </div>

      {/* Related dishes */}
      {more.length > 0 && (
        <section className="mt-20 md:mt-28">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-4xl font-medium">You may also like</h2>
            <Link href={`/menu?c=${cat?.slug}`} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:underline">
              More {cat?.name} →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => <DishCard key={m.id} item={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}
