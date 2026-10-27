"use client";

import Link from "next/link";
import { Plus, Star, Flame } from "lucide-react";
import { toast } from "sonner";
import { cart } from "@/lib/store";
import { fmt } from "@/lib/brand";
import type { MenuItem } from "@/lib/types";

export function DishCard({ item, onOpen }: { item: MenuItem; onOpen?: (i: MenuItem) => void }) {
  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    cart.add(item.id);
    toast.success(`${item.name} added to your order`, {
      action: { label: "View cart", onClick: () => window.dispatchEvent(new Event("maison:open-cart")) },
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      {/* Image */}
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="relative block aspect-[4/3] overflow-hidden text-left"
        aria-label={`View details for ${item.name}`}
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={900}
          height={675}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Sold out overlay */}
        {!item.available && (
          <span className="absolute inset-0 grid place-items-center bg-espresso/60 text-sm font-semibold uppercase tracking-widest text-cream">
            Sold out today
          </span>
        )}

        {/* Top-left badges — priority: chefPick > bestSeller */}
        {item.available && item.chefPick && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-cream/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-terracotta shadow-soft">
            <Flame className="size-3" /> Chef&apos;s pick
          </span>
        )}
        {item.available && !item.chefPick && item.bestSeller && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-espresso shadow-soft">
            <Star className="size-3 fill-current" /> Popular
          </span>
        )}
        {item.available && item.featured && !item.chefPick && !item.bestSeller && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cream">
            Featured
          </span>
        )}
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-tight">
            <Link href={`/menu/${item.slug}`} className="hover:text-terracotta transition-colors">
              {item.name}
            </Link>
          </h3>
          <span className="shrink-0 pt-0.5 text-base font-semibold tabular-nums text-foreground">
            {fmt(item.price)}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>

        <div className="mt-auto flex items-center justify-end pt-3">
          {/* Add to cart */}
          <button
            type="button"
            disabled={!item.available}
            onClick={add}
            aria-label={`Add ${item.name} to order`}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-all hover:scale-105 hover:shadow-lift active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
