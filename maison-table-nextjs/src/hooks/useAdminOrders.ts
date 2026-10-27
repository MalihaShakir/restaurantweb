"use client";
/**
 * Polls /api/v1/admin/orders every POLL_MS milliseconds.
 * Returns { orders, loading, error, refresh }.
 * Works on Vercel (no WebSocket needed — polling is sufficient for a restaurant).
 */
import { useEffect, useCallback, useRef, useState } from "react";

export type ApiOrderLine = {
  menuItemId: string;
  name: string;
  priceCents: number;
  qty: number;
  note: string;
  lineTotalCents: number;
  price: number;
  lineTotal: number;
};

export type ApiOrder = {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string; address: string; email?: string };
  lines: ApiOrderLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  subtotalCents: number;
  totalCents: number;
  paymentMethod: "cod" | "online";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  promoCode?: string;
  deliveryNotes?: string;
  riderId?: string;
  riderName?: string;
  assignedAt?: string;
  statusHistory: { status: string; at: string; actor: string; actorName: string }[];
  codCollection?: { collectedAt: string; collectedByName: string };
  createdAt: string;
  updatedAt: string;
};

const POLL_MS = 15_000;

export function useAdminOrders(status?: string) {
  const [orders,  setOrders]  = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch_ = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = status
        ? `/api/v1/admin/orders?status=${status}&limit=100`
        : `/api/v1/admin/orders?limit=100`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetch_();
    timer.current = setInterval(() => fetch_(true), POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetch_]);

  return { orders, loading, error, refresh: () => fetch_() };
}

export function useAdminStats() {
  const [data,    setData]    = useState<null | {
    stats: {
      todayOrders: number; todayRevenue: number; pendingOrders: number;
      preparingOrders: number; outForDelivery: number; deliveredToday: number; cancelledToday: number;
    };
    recentOrders: ApiOrder[];
    weekRevenue: { date: string; revenue: number; count: number }[];
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch_ = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    timer.current = setInterval(() => fetch_(true), POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetch_]);

  return { data, loading, error, refresh: () => fetch_() };
}
