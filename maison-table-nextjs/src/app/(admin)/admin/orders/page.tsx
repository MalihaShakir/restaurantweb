"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { useOrderActions, useNewOrderAlert } from "@/hooks/useOrderActions";
import { OrderCard } from "@/components/admin/OrderCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "All",          value: "all" },
  { label: "New",          value: "pending" },
  { label: "Confirmed",    value: "confirmed" },
  { label: "Preparing",    value: "preparing" },
  { label: "Ready",        value: "ready" },
  { label: "Delivering",   value: "out_for_delivery" },
  { label: "Delivered",    value: "delivered" },
  { label: "Cancelled",    value: "cancelled" },
] as const;

export default function AdminOrders() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { orders, loading, error, refresh } = useAdminOrders();
  const { busy, updateStatus, collectCod } = useOrderActions(refresh);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const { muted, toggleMute } = useNewOrderAlert(pendingCount);

  const filtered = useMemo(() => {
    let list = tab === "all" ? orders : orders.filter(o => o.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.customer.address.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, tab, search]);

  const tabCount = (v: string) => v === "all" ? orders.length : orders.filter(o => o.status === v).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total · auto-refreshes every 15s</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted">
            {muted ? <VolumeX className="size-4 text-muted-foreground"/> : <Volume2 className="size-4"/>}
          </button>
          <button onClick={refresh} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")}/>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error === "401" ? "Session expired — please sign in again." : `Error: ${error}`}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(t => {
          const count = tabCount(t.value);
          return (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                tab === t.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {t.label}
              {count > 0 && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  t.value === "pending" && count > 0 ? "bg-terracotta text-white" : "bg-muted text-muted-foreground"
                )}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, customer, phone…" className="h-10 pl-9"/>
      </div>

      {/* Orders */}
      {loading && orders.length === 0 ? (
        <div className="flex items-center gap-2 py-16 text-muted-foreground justify-center">
          <RefreshCw className="size-4 animate-spin"/> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {search ? "No orders match your search." : `No ${tab === "all" ? "" : tab} orders.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <OrderCard key={o._id} order={o} busy={busy} onUpdateStatus={updateStatus} onCollectCod={collectCod}/>
          ))}
        </div>
      )}
    </div>
  );
}
