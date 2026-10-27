"use client";

import { cn } from "@/lib/utils";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/status";
import type { Dietary, OrderStatus, PaymentStatus } from "@/lib/types";

const statusTone: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-espresso ring-warning/50",
  confirmed: "bg-info/12 text-info ring-info/40",
  preparing: "bg-gold/20 text-espresso ring-gold/60",
  ready: "bg-chart-4/20 text-espresso ring-chart-4/60",
  out_for_delivery: "bg-terracotta/12 text-terracotta ring-terracotta/40",
  delivered: "bg-success/15 text-success ring-success/40",
  cancelled: "bg-destructive/10 text-destructive ring-destructive/40",
};
const payTone: Record<PaymentStatus, string> = {
  pending: "bg-muted text-muted-foreground ring-border",
  paid: "bg-success/15 text-success ring-success/40",
  failed: "bg-destructive/10 text-destructive ring-destructive/40",
  refunded: "bg-info/12 text-info ring-info/40",
};

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn(base, statusTone[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn(base, payTone[status])}>{PAYMENT_LABEL[status]}</span>;
}

const dietLabel: Record<Dietary, string> = { vegetarian: "V", vegan: "VG", "gluten-free": "GF", spicy: "Spicy", "dairy-free": "DF" };
export function DietTag({ d }: { d: Dietary }) {
  return (
    <span title={d} className="inline-flex items-center rounded-full border border-gold/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-espresso/80">
      {dietLabel[d]}
    </span>
  );
}

export function DemoBadge({ children = "Demo", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-espresso ring-1 ring-inset ring-gold/50", className)}>
      {children}
    </span>
  );
}
