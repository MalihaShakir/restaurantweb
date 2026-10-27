"use client";

import { useState, useMemo } from "react";
import { format, subDays, isAfter } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { useDB } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { cn } from "@/lib/utils";

const COLORS = [
  "#c2533a", // terracotta
  "#b89a5e", // gold
  "#3d7a54", // success-ish
  "#4a6fa5", // blue
  "#8b5e3c", // brown
  "#6b7280", // gray
];

type Range = "7d" | "30d" | "all";

export default function AdminAnalytics() {
  const db = useDB();
  const [range, setRange] = useState<Range>("30d");

  const cutoff = useMemo(() => {
    if (range === "all") return new Date(0);
    return subDays(new Date(), range === "7d" ? 7 : 30);
  }, [range]);

  const filteredOrders = useMemo(
    () => db.orders.filter((o) => isAfter(new Date(o.createdAt), cutoff)),
    [db.orders, cutoff],
  );

  const nonCancelled = filteredOrders.filter((o) => o.status !== "cancelled");

  // ── Revenue by day ──────────────────────────────────────────────────────
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const revenueByDay = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    const dayStr = d.toDateString();
    const dayOrders = nonCancelled.filter((o) => new Date(o.createdAt).toDateString() === dayStr);
    return {
      day: format(d, days <= 7 ? "EEE" : "MMM d"),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    };
  });

  // ── Payment method split ────────────────────────────────────────────────
  const paymentSplit = [
    { name: "Cash on Delivery", value: filteredOrders.filter((o) => o.paymentMethod === "cod").length },
    { name: "Online",           value: filteredOrders.filter((o) => o.paymentMethod === "online").length },
  ].filter((x) => x.value > 0);

  // ── Order status breakdown ──────────────────────────────────────────────
  const statusBreakdown = (["pending","confirmed","preparing","ready","out_for_delivery","delivered","cancelled"] as const)
    .map((s) => ({ name: s.replace(/_/g, " "), value: filteredOrders.filter((o) => o.status === s).length }))
    .filter((x) => x.value > 0);

  // ── Best-selling items ──────────────────────────────────────────────────
  const itemSales: Record<string, { name: string; qty: number; rev: number }> = {};
  nonCancelled.forEach((o) => o.lines.forEach((l) => {
    if (!itemSales[l.itemId]) itemSales[l.itemId] = { name: l.name, qty: 0, rev: 0 };
    itemSales[l.itemId]!.qty += l.qty;
    itemSales[l.itemId]!.rev += l.qty * l.price;
  }));
  const topItems = Object.values(itemSales).sort((a, b) => b.qty - a.qty).slice(0, 8);

  // ── Summary stats ───────────────────────────────────────────────────────
  const totalRev  = nonCancelled.reduce((s, o) => s + o.total, 0);
  const avgOrder  = nonCancelled.length ? totalRev / nonCancelled.length : 0;
  const cancelRate = filteredOrders.length ? (filteredOrders.filter((o) => o.status === "cancelled").length / filteredOrders.length * 100) : 0;

  const stats = [
    { label: "Orders",         value: filteredOrders.length },
    { label: "Revenue",        value: fmt(totalRev) },
    { label: "Avg order",      value: fmt(avgOrder) },
    { label: "Cancellation %", value: `${cancelRate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Demo data from localStorage — all data is local to this browser</p>
        </div>
        {/* Date range */}
        <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-0.5">
          {(["7d", "30d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                range === r ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Revenue over time</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Demo data</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByDay} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.008 80)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.48 0.015 60)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.48 0.015 60)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v: number) => [fmt(v), "Revenue"]}
              contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.008 80)", fontSize: 12 }}
            />
            <Bar dataKey="revenue" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Order volume chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Order volume</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.008 80)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.48 0.015 60)" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "oklch(0.48 0.015 60)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.008 80)", fontSize: 12 }} />
            <Line dataKey="orders" name="Orders" stroke={COLORS[1]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[1] }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Payment methods</h2>
          {paymentSplit.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {paymentSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Order status breakdown</h2>
          {statusBreakdown.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Best sellers table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Best-selling items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Rank", "Item", "Units sold", "Revenue"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topItems.map((item, i) => (
                <tr key={item.name} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="grid size-6 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 tabular-nums">{item.qty}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{fmt(item.rev)}</td>
                </tr>
              ))}
              {topItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No sales data in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
