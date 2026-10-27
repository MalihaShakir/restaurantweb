"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Banknote, CreditCard, Search, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { useDB, repo } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { PaymentBadge, StatusBadge } from "@/components/badges";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { canCollectCod } from "@/lib/status";
import { cn } from "@/lib/utils";

type PayTab = "all" | "online" | "cod";

export default function AdminPayments() {
  const db = useDB();
  const [tab, setTab] = useState<PayTab>("all");
  const [search, setSearch] = useState("");
  const [collectTarget, setCollectTarget] = useState<string | null>(null);

  const orders = useMemo(() => {
    let list = db.orders;
    if (tab === "online") list = list.filter((o) => o.paymentMethod === "online");
    if (tab === "cod")    list = list.filter((o) => o.paymentMethod === "cod");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.id.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q));
    }
    return list;
  }, [db.orders, tab, search]);

  // Summary stats
  const online   = db.orders.filter((o) => o.paymentMethod === "online");
  const cod      = db.orders.filter((o) => o.paymentMethod === "cod");
  const paid     = db.orders.filter((o) => o.paymentStatus === "paid");
  const pending  = db.orders.filter((o) => o.paymentStatus === "pending" && o.status !== "cancelled");
  const failed   = db.orders.filter((o) => o.paymentStatus === "failed");
  const refunded = db.orders.filter((o) => o.paymentStatus === "refunded");

  const paidRev = paid.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Payment status is tracked separately from order status.
          COD orders remain unpaid until staff records cash collection.
        </p>
      </div>

      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" />
        <p className="text-muted-foreground">
          <b className="text-foreground">Demo mode:</b> No real payment provider is connected.
          Online payments are simulated. COD collection updates localStorage only.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total collected",    value: fmt(paidRev),     sub: `${paid.length} orders`,       icon: CheckCircle2, color: "text-success bg-success/10" },
          { label: "Awaiting payment",   value: pending.length,   sub: "COD + unpaid online",         icon: Clock,        color: "text-amber-600 bg-amber-50" },
          { label: "Online payments",    value: online.length,    sub: `${fmt(online.reduce((s,o)=>s+o.total,0))} total`, icon: CreditCard, color: "text-blue-600 bg-blue-50" },
          { label: "Cash on delivery",   value: cod.length,       sub: `${fmt(cod.reduce((s,o)=>s+o.total,0))} total`,   icon: Banknote,   color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
              </div>
              <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", color)}>
                <Icon className="size-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Paid",     count: paid.length,     cls: "bg-success/15 text-success" },
          { label: "Pending",  count: pending.length,  cls: "bg-amber-100 text-amber-700" },
          { label: "Failed",   count: failed.length,   cls: "bg-destructive/15 text-destructive" },
          { label: "Refunded", count: refunded.length, cls: "bg-blue-100 text-blue-700" },
        ].map(({ label, count, cls }) => (
          <div key={label} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", cls)}>
            {label}: {count}
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-0.5">
          {(["all", "online", "cod"] as PayTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "All" : t === "online" ? "Online" : "COD"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order or customer…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Order", "Customer", "Method", "Amount", "Order Status", "Payment Status", "Date", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => {
              const collectible = canCollectCod(o);
              return (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{o.id}</td>
                  <td className="px-4 py-3 font-medium">{o.customer.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      {o.paymentMethod === "cod"
                        ? <><Banknote className="size-3.5 text-amber-500" /> Cash on Delivery</>
                        : <><CreditCard className="size-3.5 text-blue-500" /> Online (simulated)</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{fmt(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3"><PaymentBadge status={o.paymentStatus} /></td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {format(new Date(o.createdAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-4 py-3">
                    {collectible && (
                      <button
                        onClick={() => setCollectTarget(o.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors"
                      >
                        <Banknote className="size-3.5" /> Record cash
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">No payment records match your filters.</div>
        )}
      </div>

      {/* COD collection confirm */}
      <AlertDialog open={!!collectTarget} onOpenChange={(o) => !o && setCollectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record cash collection</AlertDialogTitle>
            <AlertDialogDescription>
              Mark order <b>{collectTarget}</b> as cash collected. This updates the payment status to &quot;Paid&quot;
              and records the timestamp. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (collectTarget) { repo.collectCod(collectTarget); setCollectTarget(null); } }}>
              Confirm collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
