"use client";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MapPin, Phone, MessageSquare, Banknote, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiOrder } from "@/hooks/useAdminOrders";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_COLOR: Record<string, string> = {
  pending:          "bg-amber-100 text-amber-800 border-amber-300",
  confirmed:        "bg-blue-100 text-blue-800 border-blue-300",
  preparing:        "bg-orange-100 text-orange-800 border-orange-300",
  ready:            "bg-emerald-100 text-emerald-800 border-emerald-300",
  out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-300",
  delivered:        "bg-green-100 text-green-800 border-green-300",
  cancelled:        "bg-red-100 text-red-800 border-red-300",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", preparing: "Preparing",
  ready: "Ready", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled",
};
const ACTION_BTN: Record<string, { label: string; cls: string }> = {
  confirmed:        { label: "✓ Confirm",       cls: "bg-blue-600 hover:bg-blue-700 text-white" },
  preparing:        { label: "🍳 Prepare",       cls: "bg-orange-500 hover:bg-orange-600 text-white" },
  ready:            { label: "🔔 Mark Ready",    cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  out_for_delivery: { label: "🛵 Dispatch",      cls: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  delivered:        { label: "✅ Delivered",     cls: "bg-green-700 hover:bg-green-800 text-white" },
  cancelled:        { label: "✕ Cancel",         cls: "bg-red-600 hover:bg-red-700 text-white" },
};
const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [], cancelled: [],
};

interface Props {
  order: ApiOrder;
  onUpdateStatus?: (orderId: string, status: string) => Promise<boolean>;
  onCollectCod?:   (orderId: string) => Promise<boolean>;
  onAssignRider?:  (orderId: string, riderId: string) => Promise<boolean>;
  riders?:         { _id: string; name: string }[];
  compact?:        boolean;
  busy?:           string | null;
  showFinancials?: boolean;
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function OrderCard({
  order, onUpdateStatus, onCollectCod, onAssignRider, riders, compact, busy, showFinancials = true,
}: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const nexts = TRANSITIONS[order.status] ?? [];
  const isBusy = busy === order._id;

  const canCollect = order.paymentMethod === "cod"
    && order.paymentStatus === "pending"
    && ["out_for_delivery", "delivered"].includes(order.status);

  const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isNew = order.status === "pending" && minutesAgo < 5;

  return (
    <div className={cn(
      "rounded-xl border bg-card transition-all",
      isNew ? "border-terracotta shadow-md ring-2 ring-terracotta/30" : "border-border shadow-soft",
    )}>
      {/* Header — always visible */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {isNew && <span className="animate-pulse rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-bold text-white uppercase">New</span>}
        <span className="font-mono text-sm font-bold text-foreground">{order.orderNumber}</span>
        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STATUS_COLOR[order.status])}>
          {STATUS_LABEL[order.status]}
        </span>
        <span className="font-medium text-sm">{order.customer.name}</span>
        <span className="text-xs text-muted-foreground">
          {minutesAgo < 60 ? `${minutesAgo}m ago` : format(new Date(order.createdAt), "h:mm a")}
        </span>
        {showFinancials && (
          <span className="ml-auto font-semibold tabular-nums text-sm">{fmt(order.totalCents)}</span>
        )}
        <span className="text-muted-foreground">{expanded ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Items */}
          <ul className="space-y-1.5">
            {order.lines.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-[11px] font-bold">{l.qty}</span>
                <span className="flex-1 font-medium">{l.name}</span>
                {l.note && <span className="flex items-center gap-1 text-xs text-amber-700"><MessageSquare className="size-3"/>{l.note}</span>}
                {showFinancials && <span className="tabular-nums text-muted-foreground">{fmt(l.lineTotalCents)}</span>}
              </li>
            ))}
          </ul>

          {order.deliveryNotes && (
            <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <MessageSquare className="size-3 shrink-0"/> {order.deliveryNotes}
            </p>
          )}

          {/* Customer info */}
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin className="size-3.5 mt-0.5 shrink-0 text-terracotta"/>
              <span>{order.customer.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="size-3.5 mt-0.5 shrink-0 text-terracotta"/>
              <a href={`tel:${order.customer.phone}`} className="hover:underline">{order.customer.phone}</a>
            </div>
          </div>

          {/* Financials */}
          {showFinancials && (
            <div className="space-y-1 border-t border-border pt-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(order.subtotalCents)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-terracotta"><span>Discount</span><span>−{fmt((order.discount ?? 0) * 100)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{order.deliveryFee === 0 ? "Free" : fmt((order.deliveryFee ?? 0) * 100)}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1"><span>Total</span><span>{fmt(order.totalCents)}</span></div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                {order.paymentMethod === "cod" ? <Banknote className="size-3.5"/> : <CreditCard className="size-3.5"/>}
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (simulated)"}
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold ml-1",
                  order.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                  order.paymentStatus === "failed" ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground"
                )}>{order.paymentStatus}</span>
              </div>
            </div>
          )}

          {/* Rider info */}
          {order.riderName && (
            <p className="text-xs text-muted-foreground">🛵 Rider: <b>{order.riderName}</b></p>
          )}

          {/* Action buttons */}
          {(nexts.length > 0 || canCollect || (onAssignRider && order.status === "ready" && !order.riderId)) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {nexts.map(next => {
                const btn = ACTION_BTN[next];
                const needsConfirm = next === "cancelled" || next === "delivered";
                return needsConfirm ? (
                  <AlertDialog key={next}>
                    <AlertDialogTrigger asChild>
                      <button disabled={isBusy} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-50", btn.cls)}>
                        {isBusy ? <Loader2 className="size-4 animate-spin"/> : btn.label}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm: {STATUS_LABEL[next]}</AlertDialogTitle>
                        <AlertDialogDescription>Move order {order.orderNumber} to &ldquo;{STATUS_LABEL[next]}&rdquo;? This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Go back</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onUpdateStatus?.(order._id, next)}>Confirm</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <button key={next} disabled={isBusy}
                    onClick={() => onUpdateStatus?.(order._id, next)}
                    className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-50", btn.cls)}
                  >
                    {isBusy ? <Loader2 className="size-4 animate-spin"/> : btn.label}
                  </button>
                );
              })}

              {canCollect && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button disabled={isBusy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                      💵 Record cash
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm cash collection</AlertDialogTitle>
                      <AlertDialogDescription>Mark {order.orderNumber} as paid (cash received)?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onCollectCod?.(order._id)}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {onAssignRider && order.status === "ready" && !order.riderId && riders && (
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                    defaultValue=""
                    onChange={e => e.target.value && onAssignRider(order._id, e.target.value)}
                  >
                    <option value="">Assign rider…</option>
                    <option value="auto">Auto-assign</option>
                    {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
