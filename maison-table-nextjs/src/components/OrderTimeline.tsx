"use client";

import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { FLOW, STATUS_LABEL } from "@/lib/status";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled")
    return (
      <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-4 text-destructive">
        <X className="size-5" /> This order was cancelled{order.paymentStatus === "refunded" ? " and refunded (simulated)." : "."}
      </div>
    );
  const idx = FLOW.indexOf(order.status);
  return (
    <ol className="relative space-y-6">
      {FLOW.map((s, i) => {
        const ev = order.history.find((h) => h.status === s);
        const done = i <= idx;
        return (
          <li key={s} className="relative flex gap-4">
            {i < FLOW.length - 1 && <span className={cn("absolute left-[15px] top-8 h-[calc(100%-4px)] w-px", i < idx ? "bg-terracotta" : "bg-border")} aria-hidden />}
            <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2", done ? "border-terracotta bg-terracotta text-primary-foreground" : "border-border bg-card", i === idx && "ring-4 ring-terracotta/20")}>
              {done ? <Check className="size-4" /> : <span className="size-1.5 rounded-full bg-border" />}
            </span>
            <div>
              <p className={cn("font-semibold", !done && "text-muted-foreground")}>{STATUS_LABEL[s]}</p>
              <p className="text-xs text-muted-foreground">{ev ? format(new Date(ev.at), "MMM d, h:mm a") : "Waiting"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
