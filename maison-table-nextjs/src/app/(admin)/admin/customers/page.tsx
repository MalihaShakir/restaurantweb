"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, ChevronDown, ChevronUp, Users, Banknote, CreditCard } from "lucide-react";
import { useDB } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { StatusBadge, PaymentBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

// Aggregate orders by customer name + phone
function buildCustomerList(orders: ReturnType<typeof useDB>["orders"]) {
  const map: Record<string, {
    name: string; phone: string; address: string;
    orders: typeof orders; totalSpent: number; lastOrder: string;
  }> = {};

  orders.forEach((o) => {
    const key = `${o.customer.name}__${o.customer.phone}`;
    if (!map[key]) {
      map[key] = { name: o.customer.name, phone: o.customer.phone, address: o.customer.address, orders: [], totalSpent: 0, lastOrder: o.createdAt };
    }
    map[key]!.orders.push(o);
    if (o.status !== "cancelled") map[key]!.totalSpent += o.total;
    if (o.createdAt > map[key]!.lastOrder) map[key]!.lastOrder = o.createdAt;
  });

  return Object.values(map).sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));
}

function CustomerRow({ c }: { c: ReturnType<typeof buildCustomerList>[number] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={cn("cursor-pointer border-b border-border transition-colors", expanded ? "bg-muted/50" : "hover:bg-muted/30")}
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            </div>
          </div>
        </td>
        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{c.address}</td>
        <td className="px-4 py-3 tabular-nums">{c.orders.length}</td>
        <td className="px-4 py-3 tabular-nums font-semibold">{fmt(c.totalSpent)}</td>
        <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
          {format(new Date(c.lastOrder), "MMM d, yyyy")}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-muted/10">
          <td colSpan={6} className="px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order history</p>
            <div className="space-y-2">
              {c.orders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                  <span className="font-mono text-xs font-semibold">{o.id}</span>
                  <span className="text-muted-foreground">{format(new Date(o.createdAt), "MMM d, h:mm a")}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {o.paymentMethod === "cod" ? <Banknote className="size-3" /> : <CreditCard className="size-3" />}
                    {o.paymentMethod === "cod" ? "COD" : "Online"}
                  </span>
                  <span className="tabular-nums font-medium">{fmt(o.total)}</span>
                  <StatusBadge status={o.status} />
                  <PaymentBadge status={o.paymentStatus} />
                  <span className="text-muted-foreground">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminCustomers() {
  const db = useDB();
  const [search, setSearch] = useState("");

  const customers = useMemo(() => buildCustomerList(db.orders), [db.orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const totalCustomers = customers.length;
  const totalRevenue   = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpend       = totalCustomers ? totalRevenue / totalCustomers : 0;
  const repeat         = customers.filter((c) => c.orders.length > 1).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aggregated from orders stored in this browser · click a row to expand order history
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Unique customers", value: totalCustomers,    icon: Users },
          { label: "Total revenue",    value: fmt(totalRevenue), icon: CreditCard },
          { label: "Avg. spend",       value: fmt(avgSpend),     icon: CreditCard },
          { label: "Repeat customers", value: repeat,            icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, address…"
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Customer", "Address", "Orders", "Total spent", "Last order", ""].map((h) => (
                <th key={h} className={cn(
                  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  h === "Address"    && "hidden sm:table-cell",
                  h === "Last order" && "hidden lg:table-cell",
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => <CustomerRow key={`${c.name}__${c.phone}`} c={c} />)}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No customers found</div>
        )}
      </div>
    </div>
  );
}
