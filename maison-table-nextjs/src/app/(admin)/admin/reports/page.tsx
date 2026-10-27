"use client";
import { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, RefreshCw, TrendingUp, ShoppingBag, XCircle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportData = {
  stats: {
    todayOrders: number; todayRevenue: number;
    pendingOrders: number; preparingOrders: number;
    outForDelivery: number; deliveredToday: number; cancelledToday: number;
  };
  weekRevenue: { date: string; revenue: number; count: number }[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format(n);
}

const CHART_COLOR = "oklch(0.53 0.16 38)";
const COLORS = ["#c2533a","#b89a5e","#3d7a54","#4a6fa5","#8b5e3c"];

export default function ReportsPage() {
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/stats", { credentials:"include" });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center gap-3 p-8 text-muted-foreground">
      <RefreshCw className="size-4 animate-spin"/> Loading reports…
    </div>
  );

  if (!data) return (
    <div className="p-8 text-destructive">Failed to load reports. Make sure you are signed in.</div>
  );

  const s = data.stats;
  const weekTotal = data.weekRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const weekOrders = data.weekRevenue.reduce((sum, d) => sum + d.count, 0);

  const statusData = [
    { name: "Delivered",    value: s.deliveredToday },
    { name: "Preparing",    value: s.preparingOrders },
    { name: "Delivering",   value: s.outForDelivery },
    { name: "Pending",      value: s.pendingOrders },
    { name: "Cancelled",    value: s.cancelledToday },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6 text-terracotta"/>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <span className="text-sm text-muted-foreground">
            Live from MongoDB · {format(new Date(), "MMM d, yyyy")}
          </span>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className="size-3.5"/> Refresh
        </button>
      </div>

      {/* Today stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label:"Orders today",     value: s.todayOrders,     icon: ShoppingBag, color:"text-blue-600 bg-blue-50" },
          { label:"Revenue today",    value: fmt(s.todayRevenue), icon: TrendingUp, color:"text-terracotta bg-terracotta/10" },
          { label:"Delivered today",  value: s.deliveredToday,  icon: ShoppingBag, color:"text-emerald-600 bg-emerald-50" },
          { label:"Cancelled today",  value: s.cancelledToday,  icon: XCircle,     color:"text-destructive bg-destructive/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
              </div>
              <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", color)}>
                <Icon className="size-5"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 7-day revenue */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold">Revenue — last 7 days</h2>
          <div className="text-right text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{fmt(weekTotal)}</span> · {weekOrders} orders
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Excludes cancelled orders</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.weekRevenue.map(d => ({
            day: format(new Date(d.date), "EEE"),
            revenue: d.revenue,
            orders: d.count,
          }))} barSize={32}>
            <XAxis dataKey="day" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
            <Tooltip
              formatter={(v: number, name: string) => [name === "revenue" ? fmt(v) : v, name === "revenue" ? "Revenue" : "Orders"]}
              contentStyle={{ borderRadius:8, fontSize:12 }}
            />
            <Bar dataKey="revenue" fill={CHART_COLOR} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Today&apos;s order status</h2>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders today.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily order counts */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Order volume — last 7 days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weekRevenue.map(d => ({
              day: format(new Date(d.date), "EEE"), orders: d.count,
            }))} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }}/>
              <Bar dataKey="orders" fill={COLORS[1]} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COD note */}
      <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm">
        <Banknote className="size-4 mt-0.5 shrink-0 text-gold"/>
        <p className="text-muted-foreground">
          <b className="text-foreground">Revenue figures</b> include only non-cancelled orders.
          COD orders are counted when placed, not when cash is collected.
          For reconciled cash totals, see the <a href="/admin/payments" className="text-terracotta underline">Payments</a> page.
        </p>
      </div>
    </div>
  );
}
