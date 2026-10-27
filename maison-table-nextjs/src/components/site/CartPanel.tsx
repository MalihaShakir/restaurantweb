"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { cart, repo, useCartSummary } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QtyStepper } from "./QtyStepper";

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { lines } = useCartSummary();
  if (!lines.length)
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-muted"><ShoppingBag className="size-6 text-muted-foreground" /></div>
        <p className="font-display text-2xl">Your table is empty</p>
        <p className="max-w-xs text-sm text-muted-foreground">Browse the menu and add something delicious.</p>
        <Button asChild variant="hero" className="mt-2"><Link href="/menu">Explore the menu</Link></Button>
      </div>
    );
  return (
    <ul className="divide-y divide-border">
      {lines.map((l) => (
        <li key={l.itemId} className="flex gap-4 py-4">
          <img src={l.item.image} alt="" className={compact ? "size-16 rounded-xl object-cover" : "size-20 rounded-xl object-cover"} loading="lazy" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between gap-2">
              <p className="font-semibold leading-tight">{l.item.name}</p>
              <p className="font-semibold tabular-nums">{fmt(l.item.price * l.qty)}</p>
            </div>
            {l.note && <p className="text-xs text-muted-foreground">Note: {l.note}</p>}
            <div className="flex items-center justify-between">
              <QtyStepper value={l.qty} min={1} onChange={(n) => cart.setQty(l.itemId, n)} label={`Quantity of ${l.item.name}`} />
              <button type="button" onClick={() => { cart.remove(l.itemId); toast(`${l.item.name} removed`); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PromoField() {
  const { promo } = useCartSummary();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  if (promo)
    return (
      <div className="flex items-center justify-between rounded-xl bg-gold/15 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2"><Tag className="size-4 text-terracotta" /><b>{promo.code}</b> · {promo.description}</span>
        <button type="button" className="text-xs underline" onClick={() => cart.setPromo(null)}>Remove</button>
      </div>
    );
  return (
    <form
      className="space-y-1"
      onSubmit={(e) => {
        e.preventDefault();
        const p = repo.findPromo(code);
        if (!p) return setErr("That code isn't valid or has expired.");
        setErr("");
        cart.setPromo(p.code);
        toast.success(`Promo ${p.code} applied`);
      }}
    >
      <div className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code (try WELCOME10)" aria-label="Promo code" maxLength={20} className="rounded-full bg-card" />
        <Button type="submit" variant="outline" className="rounded-full">Apply</Button>
      </div>
      {err && <p className="text-xs text-destructive" role="alert">{err}</p>}
    </form>
  );
}

export function TotalsBlock() {
  const { totals, settings } = useCartSummary();
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{fmt(totals.subtotal)}</dd></div>
      {totals.discount > 0 && <div className="flex justify-between text-terracotta"><dt>Discount</dt><dd className="tabular-nums">−{fmt(totals.discount)}</dd></div>}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Delivery {totals.subtotal > 0 && totals.subtotal < settings.freeDeliveryOver && <span className="text-xs">(free over {fmt(settings.freeDeliveryOver)})</span>}</dt>
        <dd className="tabular-nums">{totals.deliveryFee === 0 ? "Free" : fmt(totals.deliveryFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{fmt(totals.total)}</dd></div>
    </dl>
  );
}
