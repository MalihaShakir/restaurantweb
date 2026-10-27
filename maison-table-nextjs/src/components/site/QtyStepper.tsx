"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({ value, onChange, min = 0, className, label = "Quantity" }: { value: number; onChange: (n: number) => void; min?: number; className?: string; label?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border border-border bg-card", className)} role="group" aria-label={label}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))} className="grid size-8 place-items-center rounded-full hover:bg-muted">
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(20, value + 1))} className="grid size-8 place-items-center rounded-full hover:bg-muted">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
