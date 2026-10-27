"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Tag, Truck, Shield } from "lucide-react";
import { PageHeader } from "@/components/site/SiteLayout";
import { CartLines, PromoField, TotalsBlock } from "@/components/site/CartPanel";
import { Button } from "@/components/ui/button";
import { useCartSummary } from "@/lib/store";
import { fmt } from "@/lib/brand";

export default function CartPage() {
  const { count, totals, settings } = useCartSummary();
  const below = totals.subtotal > 0 && totals.subtotal < settings.minOrder;
  const freeShipRemaining = settings.freeDeliveryOver - totals.subtotal;

  if (count === 0) {
    return (
      <>
        <PageHeader eyebrow="Your order" title="Cart" />
        <div className="container-site pb-32 max-w-lg">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
            <div className="grid size-20 place-items-center rounded-full bg-muted">
              <ShoppingBag className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-3xl font-medium">Your table is empty</p>
              <p className="mt-2 text-muted-foreground">Browse the menu and add something delicious to get started.</p>
            </div>
            <Button asChild variant="hero" size="xl">
              <Link href="/menu">Explore the menu →</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Free delivery over {fmt(settings.freeDeliveryOver)} · Min order {fmt(settings.minOrder)}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Your order" title="Cart">
        {count} {count === 1 ? "item" : "items"} ready to order
      </PageHeader>

      <div className="container-site grid gap-10 pb-32 lg:grid-cols-[1fr_380px]">
        {/* Left: cart lines */}
        <div className="space-y-4">
          {/* Free shipping progress */}
          {freeShipRemaining > 0 && totals.subtotal > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
              <Truck className="size-4 shrink-0 text-gold" />
              <p>
                Add{" "}
                <b className="text-foreground">{fmt(freeShipRemaining)}</b>{" "}
                more for free delivery
              </p>
            </div>
          )}
          {totals.deliveryFee === 0 && totals.subtotal > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
              <Truck className="size-4 shrink-0" />
              <p><b>Free delivery</b> applied to your order</p>
            </div>
          )}

          {/* Item list */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold">Order items</h2>
            </div>
            <div className="px-6">
              <CartLines />
            </div>
            <div className="px-6 py-4 border-t border-border">
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Continue shopping
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, text: `~${settings.etaMinutes} min delivery` },
              { icon: Shield, text: "Safe checkout" },
              { icon: Tag, text: "Promo codes accepted" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center">
                <Icon className="size-4 text-terracotta" />
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: summary */}
        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-3xl font-semibold">Order summary</h2>

          <PromoField />

          <TotalsBlock />

          {below && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Minimum order is <b>{fmt(settings.minOrder)}</b>. Add{" "}
              {fmt(settings.minOrder - totals.subtotal)} more to proceed.
            </div>
          )}

          <Button
            asChild={!below}
            disabled={below}
            variant="hero"
            className="h-13 w-full text-base"
            size="xl"
          >
            {below ? (
              <span>Proceed to checkout</span>
            ) : (
              <Link href="/checkout">
                Proceed to checkout · {fmt(totals.total)}
              </Link>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Demo store — orders are saved only in this browser session.
          </p>
        </aside>
      </div>
    </>
  );
}
