"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ShoppingBag, TrendingUp, Clock, CheckCircle2, XCircle, Truck, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAdminStats } from "@/hooks/useAdminOrders";
import { useOrderActions, useNewOrderAlert } from "@/hooks/useOrderActions";
import { OrderCard } from "@/components/admin/OrderCard";
import { cn } from "@/lib/utils";

const CHART_COLOR = "oklch(0.53 0.16 38)";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useAdminStats();
  const { busy, updateStatus, collectCod } = useOrderActions(refresh);
  const pendingCount = data?.stats.pendingOrders ?? 0;
  const { muted, toggleMute } = useNewOrderAlert(pendingCount);

  if (loading) return (
    <div className="flex items-center gap-3 p-8 text-muted-foreground">
      <RefreshCw className="size-4 animate-spin"/> Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
      <b>Error loading dashboard:</b> {error}
      {error === "401" && <span> — <Link href="/admin/login" className="underline">Sign in</Link></span>}
    </div>
  );

  const s = data!.stats;
  const stats = [
    { label: "Orders today",    value: s.todayOrders,    sub: `${s.pendingOrders} pending`,    icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Revenue today",   value: fmt(s.todayRevenue), sub: "non-cancelled",              icon: TrendingUp,  color: "text-terracotta bg-terracotta/10" },
    { label: "In kitchen",      value: s.preparingOrders, sub: "confirmed + preparing",         icon: Clock,       color: "text-amber-600 bg-amber-50" },
    { label: "Out for delivery",value: s.outForDelivery,  sub: "active deliveries",             icon: Truck,       color: "text-indigo-600 bg-indigo-50" },
    { label: "Delivered today", value: s.deliveredToday,  sub: "completed",                     icon: CheckCircle2,color: "text-success bg-success/10" },
    { label: "Cancelled today", value: s.cancelledToday,  sub: "",                              icon: XCircle,     color: "text-destructive bg-destructive/10" },
  ];

  const pending = data!.recentOrders.filter(o => o.status === "pending");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")} · live data from MongoDB</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} title={muted ? "Unmute new order alerts" : "Mute new order alerts"}
            className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted">
            {muted ? <VolumeX className="size-4 text-muted-foreground"/> : <Volume2 className="size-4 text-foreground"/>}
          </button>
          <button onClick={refresh} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className="size-3.5"/> Refresh
          </button>
        </div>
      </div>

      {/* New order alert */}
      {pending.length > 0 && (
        <div className="rounded-xl border-2 border-terracotta bg-terracotta/5 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-terracotta text-white font-bold text-lg animate-bounce">{pending.length}</span>
            <div>
              <p className="font-semibold text-foreground">New {pending.length === 1 ? "order" : "orders"} waiting!</p>
              <p className="text-sm text-muted-foreground">Confirm or reject from Orders page</p>
            </div>
          </div>
          <Link href="/admin/orders" className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white hover:bg-terracotta/90">
            View orders →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
                {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
              </div>
              <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", color)}>
                <Icon className="size-5"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Revenue — last 7 days</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data!.weekRevenue.map(d => ({ day: format(new Date(d.date), "EEE"), revenue: d.revenue }))} barSize={28}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
            <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} contentStyle={{ borderRadius: 8, fontSize: 12 }}/>
            <Bar dataKey="revenue" fill={CHART_COLOR} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-terracotta hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {data!.recentOrders.slice(0, 6).map(o => (
            <OrderCard key={o._id} order={o} busy={busy} onUpdateStatus={updateStatus} onCollectCod={collectCod} compact/>
          ))}
          {data!.recentOrders.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No orders yet today.</p>
          )}
        </div>
      </section>
    </div>
  );
}
