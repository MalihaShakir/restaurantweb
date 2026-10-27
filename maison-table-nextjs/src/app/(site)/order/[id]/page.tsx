"use client";

import { use } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Phone, CreditCard, Banknote, ArrowLeft } from "lucide-react";
import { OrderTimeline } from "@/components/OrderTimeline";
import { PaymentBadge, StatusBadge, DemoBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { format } from "date-fns";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const db = useDB();
  const { id } = use(params);
  const o = db.orders.find((x) => x.id === id);

  if (!o)
    return (
      <div className="container-site py-32 text-center">
        <p className="text-6xl mb-4">📦</p>
        <h1 className="font-display text-5xl font-medium">Order not found</h1>
        <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
          Demo orders are stored only in this browser. If you placed an order on a different device it won&apos;t appear here.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero"><Link href="/menu">Browse the menu</Link></Button>
          <Button asChild variant="outline" className="rounded-full"><Link href="/account/orders">My orders</Link></Button>
        </div>
      </div>
    );

  const isActive = !["delivered", "cancelled"].includes(o.status);

  return (
    <div className="container-site py-10 md:py-16">
      {/* Back */}
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="size-3.5" /> All orders
      </Link>

      {/* Hero confirmation */}
      <div className="reveal mb-10 flex flex-col items-start gap-4">
        <DemoBadge>Demo order · localStorage only</DemoBadge>

        {o.status === "cancelled" ? (
          <p className="text-5xl">❌</p>
        ) : (
          <CheckCircle2 className="size-12 text-success" />
        )}

        <div>
          <h1 className="font-display text-5xl font-medium leading-tight md:text-6xl">
            {o.status === "cancelled"
              ? "Order cancelled"
              : `Thank you, ${o.customer.name.split(" ")[0]}.`}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {o.status === "cancelled"
              ? `Order ${o.id} was cancelled.`
              : `Order ${o.id} received · Estimated arrival ~${db.settings.etaMinutes} min`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={o.status} />
          <PaymentBadge status={o.paymentStatus} />
          {isActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-success/30">
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              Live tracking
            </span>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Tracking timeline */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl font-medium mb-2">Order progress</h2>
            <p className="text-sm text-muted-foreground mb-8">
              The restaurant updates this when the status changes in the admin panel (same browser).
            </p>
            <OrderTimeline order={o} />
          </section>

          {/* Delivery info */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Delivery details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="size-4 shrink-0 text-terracotta mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Delivering to</p>
                  <p className="font-medium">{o.customer.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-4 shrink-0 text-terracotta mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Contact</p>
                  <p className="font-medium">{o.customer.name} · {o.customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {o.paymentMethod === "cod" ? (
                  <Banknote className="size-4 shrink-0 text-terracotta mt-0.5" />
                ) : (
                  <CreditCard className="size-4 shrink-0 text-terracotta mt-0.5" />
                )}
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Payment</p>
                  <p className="font-medium">
                    {o.paymentMethod === "cod"
                      ? "Cash on delivery — pay the rider on arrival"
                      : `Online payment (simulated) — ${o.paymentStatus}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="size-4 shrink-0 text-terracotta mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Ordered at</p>
                  <p className="font-medium">{format(new Date(o.createdAt), "MMMM d, yyyy · h:mm a")}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl font-medium">Your order</h2>

          <ul className="divide-y divide-border text-sm">
            {o.lines.map((l) => (
              <li key={l.itemId} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{l.qty} × {l.name}</p>
                  {l.note && <p className="mt-0.5 text-xs text-muted-foreground italic">{l.note}</p>}
                </div>
                <span className="tabular-nums font-medium shrink-0">{fmt(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{fmt(o.subtotal)}</dd>
            </div>
            {o.discount > 0 && (
              <div className="flex justify-between text-terracotta">
                <dt>Discount {o.promoCode && `(${o.promoCode})`}</dt>
                <dd className="tabular-nums">−{fmt(o.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery fee</dt>
              <dd className="tabular-nums">{o.deliveryFee === 0 ? "Free" : fmt(o.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total paid</dt>
              <dd className="tabular-nums">{fmt(o.total)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="hero" className="w-full">
              <Link href="/menu">Order again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/account/orders">All my orders</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
