"use client";

import { useState } from "react";
import { Pencil, Check, X, Tag } from "lucide-react";
import { useDB, repo } from "@/lib/store";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";

function CategoryRow({ cat, itemCount }: { cat: Category; itemCount: number }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: cat.name, description: cat.description });

  const save = () => {
    if (!form.name.trim()) return;
    repo.update((d) => ({
      ...d,
      categories: d.categories.map((c) =>
        c.id === cat.id ? { ...c, name: form.name.trim(), description: form.description.trim() } : c,
      ),
    }));
    setEditing(false);
  };

  const cancel = () => { setForm({ name: cat.name, description: cat.description }); setEditing(false); };

  if (editing) {
    return (
      <tr className="border-b border-border bg-muted/20">
        <td className="px-4 py-3">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" autoFocus />
        </td>
        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{cat.slug}</td>
        <td className="px-4 py-3">
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9" />
        </td>
        <td className="px-4 py-3 tabular-nums">{cat.sort}</td>
        <td className="px-4 py-3 tabular-nums">{itemCount}</td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25">
              <Check className="size-3" /> Save
            </button>
            <button onClick={cancel} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <X className="size-3" /> Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium">{cat.name}</td>
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{cat.slug}</td>
      <td className="px-4 py-3 text-muted-foreground">{cat.description}</td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">{cat.sort}</td>
      <td className="px-4 py-3 tabular-nums">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">{itemCount}</span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Pencil className="size-3" /> Edit
        </button>
      </td>
    </tr>
  );
}

export default function AdminCategories() {
  const db = useDB();
  const sorted = [...db.categories].sort((a, b) => a.sort - b.sort);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {db.categories.length} categories · click Edit to rename or update description
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Name", "Slug", "Description", "Sort", "Items", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                itemCount={db.menu.filter((m) => m.categoryId === cat.id).length}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Tag className="size-4 text-gold" />
          <b className="text-foreground">Demo limitation:</b> Adding or removing categories requires a backend. Currently, you can rename and re-describe existing categories. New categories can be added directly in <code className="rounded bg-muted px-1">src/lib/seed.ts</code>.
        </p>
      </div>
    </div>
  );
}
