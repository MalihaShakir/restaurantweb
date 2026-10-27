"use client";
/**
 * /track/[orderNumber] — Secure customer order tracking.
 * Requires phone number to prove ownership.
 * Auto-refreshes every 30s while order is active.
 */
import { use, useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  CheckCircle2, Clock, MapPin, Phone, Banknote, CreditCard,
  RefreshCw, ArrowLeft, Truck, ChefHat, Package, XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FLOW = [
  { status: "pending",          label: "Order placed",       icon: Package },
  { status: "confirmed",        label: "Order confirmed",    icon: CheckCircle2 },
  { status: "preparing",        label: "Being prepared",     icon: ChefHat },
  { status: "ready",            label: "Ready for pickup",   icon: Clock },
  { status: "out_for_delivery", label: "On the way",         icon: Truck },
  { status: "delivered",        label: "Delivered",          icon: CheckCircle2 },
];

type TrackData = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string;
  deliveryNotes?: string;
  riderName?: string;
  createdAt: string;
  customer: { name: string; address: string };
  lines: { name: string; qty: number; note?: string; price: number; lineTotal: number }[];
  statusHistory: { status: string; at: string }[];
  restaurant: { name: string; etaMinutes: number };
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function TrackPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [phone,   setPhone]   = useState("");
  const [input,   setInput]   = useState("");
  const [data,    setData]    = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const load = useCallback(async (ph: string, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/v1/track/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(ph)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Order not found. Check your phone number and order number.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  // Auto-refresh while order is active
  useEffect(() => {
    if (!phone || !data) return;
    const ACTIVE = ["pending","confirmed","preparing","ready","out_for_delivery"];
    if (!ACTIVE.includes(data.status)) return;
    const t = setInterval(() => load(phone, true), 30_000);
    return () => clearInterval(t);
  }, [phone, data, load]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ph = input.trim();
    if (!ph) { setError("Enter your phone number"); return; }
    setPhone(ph);
    load(ph);
  };

  const isCancelled = data?.status === "cancelled";
  const isDelivered = data?.status === "delivered";
  const currentIdx  = FLOW.findIndex(f => f.status === data?.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container-site flex h-14 items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Home
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-sm font-semibold">{orderNumber.toUpperCase()}</span>
        </div>
      </header>

      <div className="container-site py-10 max-w-lg">
        <h1 className="font-display text-3xl font-medium mb-2">Track your order</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Order <span className="font-mono font-semibold">{orderNumber.toUpperCase()}</span>
        </p>

        {/* Phone verification form */}
        {!data && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div>
              <p className="font-medium mb-1">Enter your phone number</p>
              <p className="text-sm text-muted-foreground mb-4">
                The number you used when placing this order.
              </p>
              <Input
                type="tel"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="+1 415 555 0100"
                className="h-12"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="hero" className="h-12 w-full" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2"><RefreshCw className="size-4 animate-spin"/>Checking…</span>
                : "Track order"}
            </Button>
          </form>
        )}

        {/* Tracking view */}
        {data && (
          <div className="space-y-6">
            {/* Status hero */}
            <div className={cn(
              "rounded-2xl border-2 p-6 text-center",
              isCancelled ? "border-destructive/40 bg-destructive/5"
              : isDelivered ? "border-emerald-400 bg-emerald-50"
              : "border-terracotta/40 bg-terracotta/5",
            )}>
              {isCancelled ? (
                <XCircle className="mx-auto size-12 text-destructive mb-3" />
              ) : isDelivered ? (
                <CheckCircle2 className="mx-auto size-12 text-emerald-600 mb-3" />
              ) : (
                <div className="mx-auto size-12 rounded-full border-4 border-terracotta/30 border-t-terracotta animate-spin mb-3" />
              )}
              <p className="text-xl font-bold">
                {isCancelled ? "Order Cancelled"
                : isDelivered ? "Delivered!"
                : FLOW[currentIdx]?.label ?? data.status}
              </p>
              {data.riderName && !isDelivered && !isCancelled && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  🛵 Your rider is <b>{data.riderName}</b>
                </p>
              )}
              {!isDelivered && !isCancelled && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Est. {data.restaurant.etaMinutes} min · auto-refreshes
                </p>
              )}
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-semibold mb-4">Order progress</h2>
                <ol className="space-y-4">
                  {FLOW.map((step, i) => {
                    const done    = i <= currentIdx;
                    const current = i === currentIdx;
                    const event   = data.statusHistory.find(h => h.status === step.status);
                    const Icon    = step.icon;
                    return (
                      <li key={step.status} className="flex gap-4">
                        {i < FLOW.length - 1 && (
                          <div className="absolute ml-[15px] mt-8 h-full w-px bg-border" aria-hidden />
                        )}
                        <div className={cn(
                          "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 transition-all",
                          done
                            ? current
                              ? "border-terracotta bg-terracotta text-white ring-4 ring-terracotta/20"
                              : "border-terracotta bg-terracotta text-white"
                            : "border-border bg-card",
                        )}>
                          {done
                            ? <Icon className="size-3.5" />
                            : <span className="size-1.5 rounded-full bg-border" />}
                        </div>
                        <div className="pb-4">
                          <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event ? format(new Date(event.at), "MMM d, h:mm a") : "Waiting…"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Order summary */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold">Your order</h2>
              <ul className="divide-y divide-border">
                {data.lines.map((l, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <span className="font-medium">{l.qty} × {l.name}</span>
                      {l.note && <p className="text-xs text-amber-700 mt-0.5">{l.note}</p>}
                    </div>
                    <span className="tabular-nums text-muted-foreground">{fmt(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{fmt(data.subtotal)}</dd></div>
                {data.discount > 0 && (
                  <div className="flex justify-between text-terracotta">
                    <dt>Discount {data.promoCode && `(${data.promoCode})`}</dt>
                    <dd>−{fmt(data.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{data.deliveryFee === 0 ? "Free" : fmt(data.deliveryFee)}</dd></div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
                  <dt>Total</dt><dd>{fmt(data.total)}</dd>
                </div>
              </dl>
              <div className="flex items-center gap-2 text-sm pt-1">
                {data.paymentMethod === "cod"
                  ? <><Banknote className="size-4 text-amber-500" /><span>Cash on Delivery — {data.paymentStatus === "paid" ? "✅ Collected" : "Collect on arrival"}</span></>
                  : <><CreditCard className="size-4 text-blue-500" /><span>Online · {data.paymentStatus}</span></>}
              </div>
            </div>

            {/* Delivery address */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h2 className="font-semibold">Delivery details</h2>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="size-4 shrink-0 text-terracotta mt-0.5" />
                <span>{data.customer.address}</span>
              </div>
              {data.deliveryNotes && (
                <div className="flex items-start gap-2 text-sm text-amber-700">
                  <span>📝</span><span>{data.deliveryNotes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => load(phone)}>
                <RefreshCw className="size-4 mr-2" /> Refresh
              </Button>
              <Button asChild variant="hero" className="flex-1">
                <Link href="/menu">Order again</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
