"use client";
/**
 * Delivery Management — owner assigns riders, monitors active deliveries.
 */
import { useEffect, useCallback, useState } from "react";
import { format } from "date-fns";
import { Truck, RefreshCw, MapPin, Phone, Package } from "lucide-react";
import type { ApiOrder } from "@/hooks/useAdminOrders";
import { useOrderActions } from "@/hooks/useOrderActions";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/badges";

type Rider = { _id: string; name: string; email: string; phone?: string; active: boolean };

const STATUS_LABEL: Record<string, string> = {
  ready:"Ready for pickup", out_for_delivery:"Out for delivery", delivered:"Delivered"
};

export default function DeliveryPage() {
  const [orders,  setOrders]  = useState<ApiOrder[]>([]);
  const [riders,  setRiders]  = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    try {
      const [ordRes, ridRes] = await Promise.all([
        fetch("/api/v1/admin/orders?status=ready&limit=100", { credentials:"include" }),
        fetch("/api/v1/admin/riders", { credentials:"include" }),
      ]);
      const activeRes = await fetch("/api/v1/admin/orders?status=out_for_delivery&limit=100", { credentials:"include" });
      if (!ordRes.ok || !ridRes.ok) throw new Error("Load failed");
      const ordData    = await ordRes.json();
      const activeData = await activeRes.json();
      const ridData    = await ridRes.json();
      setOrders([...(ordData.orders ?? []), ...(activeData.orders ?? [])]);
      setRiders(ridData ?? []);
      setError("");
    } catch { setError("Failed to load delivery data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const { busy, updateStatus, assignRider } = useOrderActions(load);

  const ready       = orders.filter(o => o.status === "ready");
  const outDelivery = orders.filter(o => o.status === "out_for_delivery");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Truck className="size-6 text-indigo-600"/>
          <h1 className="text-2xl font-semibold">Delivery Management</h1>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")}/> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Available riders */}
      <section>
        <h2 className="mb-3 font-semibold text-foreground">Riders ({riders.length})</h2>
        <div className="flex flex-wrap gap-2">
          {riders.length === 0 && <p className="text-sm text-muted-foreground">No riders registered. <a href="/admin/riders" className="text-terracotta underline">Add riders →</a></p>}
          {riders.map(r => (
            <div key={r._id} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
              r.active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-border bg-muted text-muted-foreground")}>
              <span className="size-2 rounded-full bg-current"/>
              {r.name}
              {r.phone && <span className="text-xs opacity-70">· {r.phone}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Ready orders — assign riders */}
      <section>
        <h2 className="mb-3 font-semibold">Ready for Pickup ({ready.length})</h2>
        {ready.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No orders ready for pickup.</p>
        ) : (
          <div className="space-y-3">
            {ready.map(o => (
              <div key={o._id} className="rounded-xl border-2 border-emerald-300 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="font-mono font-bold">{o.orderNumber}</span>
                    <span className="ml-3 text-sm text-muted-foreground">{o.customer.name}</span>
                  </div>
                  <span className="text-sm font-semibold">${(o.totalCents/100).toFixed(2)} · {o.paymentMethod.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 text-terracotta"/>
                  {o.customer.address}
                </div>
                {o.riderName ? (
                  <p className="text-sm">🛵 Assigned to <b>{o.riderName}</b></p>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
                      defaultValue=""
                      onChange={async e => {
                        if (e.target.value) await assignRider(o._id, e.target.value);
                      }}
                    >
                      <option value="">Assign rider…</option>
                      <option value="auto">Auto-assign</option>
                      {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                )}
                {o.riderName && (
                  <button disabled={busy === o._id}
                    onClick={() => updateStatus(o._id, "out_for_delivery")}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                    🛵 Mark dispatched
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active deliveries */}
      <section>
        <h2 className="mb-3 font-semibold">Active Deliveries ({outDelivery.length})</h2>
        {outDelivery.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No active deliveries.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {outDelivery.map(o => {
              const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
              return (
                <div key={o._id} className={cn("rounded-xl border p-4 space-y-2", mins > 60 ? "border-red-300 bg-red-50" : "border-border bg-card")}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm">{o.orderNumber}</span>
                    <span className={cn("text-xs font-semibold", mins > 60 ? "text-red-600" : "text-muted-foreground")}>{mins}m</span>
                  </div>
                  <p className="text-sm font-medium">{o.customer.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0"/>{o.customer.address}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3 shrink-0"/>{o.customer.phone}
                  </div>
                  {o.riderName && <p className="text-xs text-muted-foreground">🛵 {o.riderName}</p>}
                  <div className="text-xs font-semibold">${(o.totalCents/100).toFixed(2)} · {o.paymentMethod.toUpperCase()}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
