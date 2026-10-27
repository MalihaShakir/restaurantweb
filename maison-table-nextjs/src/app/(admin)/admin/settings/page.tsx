"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, ShieldAlert, ToggleLeft, ToggleRight } from "lucide-react";
import { useDB, repo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Settings } from "@/lib/types";

export default function AdminSettings() {
  const db = useDB();

  // Keep form in sync when db settings change externally (other tab / reset)
  const [form, setForm] = useState<Settings>({ ...db.settings });
  const [saved, setSaved] = useState(false);
  useEffect(() => { setForm({ ...db.settings }); }, [db.settings]);

  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    repo.update((d) => ({ ...d, settings: form }));
    setSaved(true);
    toast.success("Settings saved — changes are reflected immediately in the customer app.");
    setTimeout(() => setSaved(false), 2000);
  };

  const num = (k: keyof Settings, label: string, help?: string) => (
    <div key={String(k)} className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <Input
        type="number"
        min={0}
        step={0.5}
        value={String(form[k])}
        onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || 0 })}
        className="h-10"
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );

  const txt = (k: keyof Settings, label: string, type = "text") => (
    <div key={String(k)} className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <Input
        type={type}
        value={String(form[k])}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="h-10"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Changes apply immediately to the customer-facing site (same browser).</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={save} disabled={saved}>
          <Save className="size-4" />
          {saved ? "Saved!" : "Save all settings"}
        </Button>
      </div>

      {/* localStorage notice */}
      <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" />
        <p className="text-muted-foreground">
          <b className="text-foreground">Demo mode:</b> Settings are stored in <code className="rounded bg-muted px-1">localStorage</code> under the key{" "}
          <code className="rounded bg-muted px-1">maison-db-v1</code>. They are local to this browser and will not synchronise
          across different devices or users. A real backend is required for multi-device operation.
        </p>
      </div>

      {/* Accepting orders toggle */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Accept online orders</p>
            <p className="text-sm text-muted-foreground">
              When turned off, customers see a &quot;Kitchen closed&quot; message at checkout. The menu remains browsable.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = { ...form, acceptingOrders: !form.acceptingOrders };
              setForm(next);
              repo.update((d) => ({ ...d, settings: next }));
              toast.success(next.acceptingOrders ? "Now accepting orders" : "Order intake paused");
            }}
            className="shrink-0"
            aria-label="Toggle order acceptance"
          >
            {form.acceptingOrders
              ? <ToggleRight className="size-10 text-success" />
              : <ToggleLeft  className="size-10 text-muted-foreground" />}
          </button>
        </div>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${form.acceptingOrders ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          <span className={`size-1.5 rounded-full bg-current ${form.acceptingOrders ? "animate-pulse" : ""}`} />
          {form.acceptingOrders ? "Accepting orders" : "Not accepting orders"}
        </div>
      </div>

      {/* Restaurant profile */}
      <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Restaurant profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("name",  "Restaurant name")}
          {txt("phone", "Phone")}
          {txt("email", "Email", "email")}
        </div>
        {txt("address", "Address")}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">About / tagline</label>
          <Textarea
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            className="resize-none"
            rows={3}
          />
        </div>
        <Button type="submit" variant="hero" className="h-11 gap-2">
          <Save className="size-4" /> Save profile
        </Button>
      </form>

      {/* Delivery & fees */}
      <div className="space-y-5 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Delivery & fees</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {num("deliveryFee",      "Delivery fee ($)",       "Charged on orders below the free threshold")}
          {num("freeDeliveryOver", "Free delivery over ($)", "0 = always charge; orders above this get free delivery")}
          {num("minOrder",         "Minimum order ($)",      "Orders below this value cannot be checked out")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {num("etaMinutes",       "Estimated delivery (mins)")}
          {num("deliveryRadiusKm", "Delivery radius (km)")}
        </div>
        <Button variant="hero" className="h-10 gap-2" onClick={save}>
          <Save className="size-4" /> Save fees
        </Button>
      </div>

      {/* Opening hours */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 font-semibold">Opening hours</h2>
        <div className="space-y-2">
          {form.hours.map((h, i) => (
            <div key={h.day} className="grid grid-cols-[100px_1fr_1fr_100px] items-center gap-3 text-sm">
              <span className="font-medium">{h.day}</span>
              <Input
                value={h.open}
                disabled={h.closed}
                onChange={(e) => {
                  const hours = [...form.hours];
                  hours[i] = { ...h, open: e.target.value };
                  setForm({ ...form, hours });
                }}
                className="h-9"
                placeholder="17:00"
              />
              <Input
                value={h.close}
                disabled={h.closed}
                onChange={(e) => {
                  const hours = [...form.hours];
                  hours[i] = { ...h, close: e.target.value };
                  setForm({ ...form, hours });
                }}
                className="h-9"
                placeholder="22:00"
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) => {
                    const hours = [...form.hours];
                    hours[i] = { ...h, closed: e.target.checked };
                    setForm({ ...form, hours });
                  }}
                  className="size-4 accent-terracotta"
                />
                Closed
              </label>
            </div>
          ))}
        </div>
        <Button variant="hero" className="mt-5 h-10 gap-2" onClick={save}>
          <Save className="size-4" /> Save hours
        </Button>
      </div>
    </div>
  );
}
