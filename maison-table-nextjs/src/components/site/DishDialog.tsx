"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DietTag } from "@/components/badges";
import { QtyStepper } from "./QtyStepper";
import { cart } from "@/lib/store";
import { fmt } from "@/lib/brand";
import type { MenuItem } from "@/lib/types";

export function AddToOrder({ item, onDone }: { item: MenuItem; onDone?: () => void }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  useEffect(() => { setQty(1); setNote(""); }, [item.id]);
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        Kitchen note <span className="text-muted-foreground">(optional)</span>
        <Textarea value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="e.g. no chili, extra sauce" className="mt-2 bg-card" />
      </label>
      <div className="flex items-center gap-3">
        <QtyStepper value={qty} min={1} onChange={setQty} className="h-12" />
        <Button
          variant="hero"
          className="h-12 flex-1"
          disabled={!item.available}
          onClick={() => {
            cart.add(item.id, qty, note.trim() || undefined);
            toast.success(`${qty} × ${item.name} added`, { action: { label: "View cart", onClick: () => window.dispatchEvent(new Event("maison:open-cart")) } });
            onDone?.();
          }}
        >
          {item.available ? `Add · ${fmt(item.price * qty)}` : "Sold out today"}
        </Button>
      </div>
    </div>
  );
}

export function DishDialog({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden bg-background p-0 sm:rounded-2xl">
        {item && (
          <div className="grid md:grid-cols-2">
            <img src={item.image} alt={item.name} className="aspect-square size-full object-cover" />
            <div className="flex flex-col gap-4 p-6 md:p-8">
              <DialogTitle className="font-display text-4xl font-medium leading-tight">{item.name}</DialogTitle>
              <DialogDescription className="text-base">{item.description}</DialogDescription>
              <div className="flex flex-wrap gap-1">{item.dietary.map((d) => <DietTag key={d} d={d} />)}</div>
              <p className="font-display text-3xl">{fmt(item.price)}</p>
              <div className="mt-auto"><AddToOrder item={item} onDone={onClose} /></div>
              <Link href={`/menu/${item.slug}`} className="text-center text-xs text-muted-foreground underline" onClick={onClose}>Open full page</Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
