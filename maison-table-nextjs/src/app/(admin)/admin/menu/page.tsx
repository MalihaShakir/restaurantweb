"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Star, Flame } from "lucide-react";
import { useDB, repo } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Dietary, MenuItem } from "@/lib/types";

const DIETARY_OPTIONS: { value: Dietary; label: string }[] = [
  { value: "vegetarian",  label: "🌿 Vegetarian" },
  { value: "vegan",       label: "🌱 Vegan" },
  { value: "gluten-free", label: "GF Gluten-free" },
  { value: "dairy-free",  label: "DF Dairy-free" },
  { value: "spicy",       label: "🌶 Spicy" },
];

const blank = (): Omit<MenuItem, "id"> => ({
  slug: "", name: "", description: "", price: 0, categoryId: "",
  image: "", dietary: [], available: true, featured: false,
  bestSeller: false, chefPick: false,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function MenuForm({
  initial, id, onSave, onCancel,
}: { initial: Omit<MenuItem, "id">; id: string; onSave: () => void; onCancel: () => void }) {
  const db = useDB();
  const [form, setForm] = useState<Omit<MenuItem, "id">>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleDiet = (d: Dietary) =>
    set("dietary", form.dietary.includes(d) ? form.dietary.filter((x) => x !== d) : [...form.dietary, d]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.categoryId) e.categoryId = "Select a category";
    if (form.price <= 0) e.price = "Enter a valid price";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const slug = form.slug.trim() || slugify(form.name);
    repo.saveMenuItem({ ...form, slug, id } as MenuItem);
    onSave();
  };

  const isNew = id.startsWith("new-");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isNew ? "Add menu item" : "Edit menu item"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="hero" onClick={save}>Save item</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main fields */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => { set("name", e.target.value); set("slug", slugify(e.target.value)); }} className="h-11" placeholder="e.g. Short Rib Tagliatelle" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Slug (URL)</label>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="h-11 font-mono text-sm" placeholder="auto-generated" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="resize-none" rows={3} placeholder="Ingredients, preparation notes…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select category…</option>
                {[...db.categories].sort((a, b) => a.sort - b.sort).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Price (USD) *</label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.price || ""}
                onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                className="h-11"
                placeholder="0.00"
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Image URL</label>
            <Input value={form.image} onChange={(e) => set("image", e.target.value)} className="h-11" placeholder="https://images.unsplash.com/photo-…" />
          </div>

          {/* Dietary */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Dietary labels</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(({ value, label }) => {
                const on = form.dietary.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDiet(value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                      on ? "border-terracotta bg-terracotta/10 text-terracotta" : "border-border text-muted-foreground hover:border-terracotta/50",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: visibility + preview */}
        <div className="space-y-4">
          {/* Visibility flags */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">Visibility & flags</p>
            {([
              { k: "available" as const, label: "Available to order", icon: Eye },
              { k: "featured"  as const, label: "Featured on homepage", icon: Star },
              { k: "chefPick"  as const, label: "Chef's pick badge", icon: Flame },
              { k: "bestSeller"as const, label: "Best seller badge", icon: Star },
            ] as const).map(({ k, label, icon: Icon }) => (
              <label key={k} className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-3.5 text-muted-foreground" /> {label}
                </span>
                <input
                  type="checkbox"
                  checked={!!form[k]}
                  onChange={(e) => set(k, e.target.checked)}
                  className="size-4 accent-terracotta"
                />
              </label>
            ))}
          </div>

          {/* Image preview */}
          {form.image && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <img src={form.image} alt="Preview" className="aspect-video w-full object-cover" />
              <p className="px-4 py-2 text-xs text-muted-foreground">Image preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMenuPage() {
  const db = useDB();
  const [editing, setEditing] = useState<{ item: Omit<MenuItem, "id">; id: string } | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const items = useMemo(() => {
    let list = db.menu;
    if (catFilter !== "all") list = list.filter((m) => m.categoryId === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
    }
    return list;
  }, [db.menu, catFilter, search]);

  if (editing) {
    return (
      <MenuForm
        initial={editing.item}
        id={editing.id}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Menu items</h1>
          <p className="text-sm text-muted-foreground">{db.menu.length} items across {db.categories.length} categories</p>
        </div>
        <Button
          variant="hero"
          className="gap-2"
          onClick={() => setEditing({ item: blank(), id: `new-${Date.now()}` })}
        >
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu…" className="h-10 pl-9" />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All categories</option>
          {[...db.categories].sort((a, b) => a.sort - b.sort).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Item", "Category", "Price", "Dietary", "Available", "Flags", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.image ? (
                      <img src={m.image} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-lg">🍽</div>
                    )}
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="max-w-[200px] truncate text-xs text-muted-foreground">{m.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {db.categories.find((c) => c.id === m.categoryId)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium">{fmt(m.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.dietary.map((d) => (
                      <span key={d} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => repo.saveMenuItem({ ...m, available: !m.available })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                      m.available ? "bg-success/15 text-success hover:bg-success/25" : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                    title={m.available ? "Click to mark unavailable" : "Click to mark available"}
                  >
                    {m.available ? <><Eye className="size-3" /> Available</> : <><EyeOff className="size-3" /> Unavailable</>}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {m.chefPick && <span title="Chef's pick" className="text-terracotta"><Flame className="size-4" /></span>}
                    {m.bestSeller && <span title="Best seller" className="text-gold"><Star className="size-4 fill-current" /></span>}
                    {m.featured && <span title="Featured" className="text-blue-500 text-[10px] font-bold">FT</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing({ item: { ...m }, id: m.id })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Pencil className="size-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="font-medium">No items match your filters</p>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item from the menu and from any existing order records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { repo.deleteMenuItem(deleteTarget.id); setDeleteTarget(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
