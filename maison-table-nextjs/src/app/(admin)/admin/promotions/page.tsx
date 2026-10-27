"use client";

import { useState } from "react";
import { Plus, Pencil, Check, X, Ticket, ShieldAlert } from "lucide-react";
import { useDB, repo } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Promotion } from "@/lib/types";

const blank = (): Omit<Promotion, "id"> => ({
  code: "", description: "", type: "percent", value: 0, active: true, minSubtotal: 0,
});

function PromoRow({
  promo, onEdit,
}: { promo: Promotion; onEdit: (p: Promotion) => void }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-semibold">{promo.code}</span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{promo.description}</td>
      <td className="px-4 py-3 capitalize">{promo.type.replace("_", " ")}</td>
      <td className="px-4 py-3 tabular-nums">
        {promo.type === "percent"       ? `${promo.value}%`
         : promo.type === "fixed"       ? fmt(promo.value)
         : "Free shipping"}
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {promo.minSubtotal ? fmt(promo.minSubtotal) : "—"}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() =>
            repo.update((d) => ({
              ...d,
              promotions: d.promotions.map((p) =>
                p.id === promo.id ? { ...p, active: !p.active } : p,
              ),
            }))
          }
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            promo.active
              ? "bg-success/15 text-success hover:bg-success/25"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {promo.active ? <><Check className="size-3" /> Active</> : <><X className="size-3" /> Inactive</>}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onEdit(promo)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Pencil className="size-3" /> Edit
        </button>
      </td>
    </tr>
  );
}

function PromoForm({
  initial, id, onSave, onCancel,
}: { initial: Omit<Promotion, "id">; id: string; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Promotion, "id">>(initial);
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.code.trim()) { setErr("Code is required"); return; }
    if (!form.description.trim()) { setErr("Description is required"); return; }
    if (form.type !== "free_delivery" && form.value <= 0) { setErr("Enter a value greater than 0"); return; }
    setErr("");
    repo.update((d) => ({
      ...d,
      promotions: d.promotions.some((p) => p.id === id)
        ? d.promotions.map((p) => (p.id === id ? { ...form, id } : p))
        : [...d.promotions, { ...form, code: form.code.toUpperCase().trim(), id }],
    }));
    onSave();
  };

  const isNew = id.startsWith("new-");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isNew ? "New promo code" : "Edit promo code"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="hero" onClick={save}>Save</Button>
        </div>
      </div>
      {err && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</p>}
      <div className="grid gap-5 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Code (shown to customers)</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="h-10 font-mono uppercase"
              placeholder="WELCOME10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Promotion["type"] })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="free_delivery">Free delivery</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Customer-facing description</label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="h-10"
            placeholder="10% off your first order"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {form.type !== "free_delivery" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                {form.type === "percent" ? "Percentage (%)" : "Amount ($)"}
              </label>
              <Input
                type="number"
                min={0}
                step={form.type === "percent" ? 1 : 0.5}
                value={form.value || ""}
                onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                className="h-10"
                placeholder={form.type === "percent" ? "10" : "5.00"}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Min. subtotal ($)</label>
            <Input
              type="number"
              min={0}
              step={1}
              value={form.minSubtotal || ""}
              onChange={(e) => setForm({ ...form, minSubtotal: parseFloat(e.target.value) || 0 })}
              className="h-10"
              placeholder="0 = no minimum"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="size-4 accent-terracotta"
          />
          Active (customers can apply this code)
        </label>
      </div>
    </div>
  );
}

export default function AdminPromotions() {
  const db = useDB();
  const [editing, setEditing] = useState<{ form: Omit<Promotion, "id">; id: string } | null>(null);

  if (editing) {
    return (
      <PromoForm
        initial={editing.form}
        id={editing.id}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const active   = db.promotions.filter((p) => p.active).length;
  const inactive = db.promotions.filter((p) => !p.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            {active} active · {inactive} inactive · try{" "}
            <code className="rounded bg-muted px-1">WELCOME10</code>,{" "}
            <code className="rounded bg-muted px-1">FREESHIP</code> at checkout
          </p>
        </div>
        <Button
          variant="hero"
          className="gap-2"
          onClick={() => setEditing({ form: blank(), id: `new-${Date.now()}` })}
        >
          <Plus className="size-4" /> New promo code
        </Button>
      </div>

      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" />
        <p className="text-muted-foreground">
          <b className="text-foreground">Demo:</b> Promo codes are stored in localStorage and validated client-side.
          In production, codes should be validated server-side to prevent abuse.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total codes",    value: db.promotions.length },
          { label: "Active",         value: active },
          { label: "Inactive",       value: inactive },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {db.promotions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <Ticket className="size-8 text-muted-foreground" />
          <p className="font-medium">No promo codes yet</p>
          <Button variant="outline" onClick={() => setEditing({ form: blank(), id: `new-${Date.now()}` })}>
            Create your first code
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Code", "Description", "Type", "Value", "Min. order", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {db.promotions.map((p) => (
                <PromoRow
                  key={p.id}
                  promo={p}
                  onEdit={(p) => setEditing({ form: { ...p }, id: p.id })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
