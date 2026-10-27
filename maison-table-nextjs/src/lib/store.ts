/**
 * Demo data service. Everything persists to localStorage in this browser only.
 * Swap the `repo` functions for API calls when a real backend is connected.
 */
import { useSyncExternalStore } from "react";
import { buildSeed } from "./seed";
import { computeTotals } from "./pricing";
import { canCollectCod, canTransition } from "./status";
import type { CartLine, DB, MenuItem, Order, OrderStatus, PaymentMethod } from "./types";

function createStore<T>(key: string, init: () => T) {
  let state: T | undefined;
  let serverState: T | undefined;
  const subs = new Set<() => void>();
  const load = (): T => {
    if (state !== undefined) return state;
    try {
      const raw = localStorage.getItem(key);
      state = raw ? (JSON.parse(raw) as T) : init();
    } catch {
      state = init();
    }
    return state!;
  };
  return {
    get: () => (typeof window === "undefined" ? (serverState ??= init()) : load()),
    getServer: () => (serverState ??= init()),
    set(updater: (s: T) => T) {
      state = updater(load());
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* storage full / private mode */
      }
      subs.forEach((f) => f());
    },
    reset() {
      state = init();
      localStorage.setItem(key, JSON.stringify(state));
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      // SSR guard: window is not available during server rendering
      if (typeof window === "undefined") {
        return () => { subs.delete(f); };
      }
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          state = undefined;
          f();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        subs.delete(f);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export const dbStore = createStore<DB>("maison-db-v1", buildSeed);
export const cartStore = createStore<{ lines: CartLine[]; promo: string | null }>("maison-cart-v1", () => ({ lines: [], promo: null }));
export const sessionStore = createStore<{ customer: { name: string; email: string } | null; admin: { name: string; email: string } | null; myOrders: string[]; sound: boolean; simulate: boolean }>(
  "maison-session-v1",
  () => ({ customer: null, admin: null, myOrders: [], sound: true, simulate: false }),
);

function useStore<T>(s: ReturnType<typeof createStore<T>>) {
  return useSyncExternalStore(s.subscribe, s.get, s.getServer);
}
export const useDB = () => useStore(dbStore);
export const useCart = () => useStore(cartStore);
export const useSession = () => useStore(sessionStore);

const nowIso = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/* ---------------- cart ---------------- */
export const cart = {
  add(itemId: string, qty = 1, note?: string) {
    cartStore.set((c) => {
      const ex = c.lines.find((l) => l.itemId === itemId);
      return {
        ...c,
        lines: ex
          ? c.lines.map((l) => (l.itemId === itemId ? { ...l, qty: Math.min(20, l.qty + qty), note: note ?? l.note } : l))
          : [...c.lines, { itemId, qty, note }],
      };
    });
  },
  setQty(itemId: string, qty: number) {
    cartStore.set((c) => ({
      ...c,
      lines: qty <= 0 ? c.lines.filter((l) => l.itemId !== itemId) : c.lines.map((l) => (l.itemId === itemId ? { ...l, qty: Math.min(20, qty) } : l)),
    }));
  },
  remove(itemId: string) {
    cartStore.set((c) => ({ ...c, lines: c.lines.filter((l) => l.itemId !== itemId) }));
  },
  setPromo(code: string | null) {
    cartStore.set((c) => ({ ...c, promo: code }));
  },
  clear() {
    cartStore.set(() => ({ lines: [], promo: null }));
  },
};

export function useCartSummary() {
  const c = useCart();
  const db = useDB();
  const lines = c.lines
    .map((l) => ({ ...l, item: db.menu.find((m) => m.id === l.itemId) }))
    .filter((l): l is typeof l & { item: MenuItem } => !!l.item);
  const promo = c.promo ? db.promotions.find((p) => p.code === c.promo && p.active) ?? null : null;
  const totals = computeTotals(
    lines.map((l) => ({ price: l.item.price, qty: l.qty })),
    { deliveryFee: db.settings.deliveryFee, freeDeliveryOver: db.settings.freeDeliveryOver, promo },
  );
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, promo, totals, count, settings: db.settings };
}

/* ---------------- orders ---------------- */
export const repo = {
  findPromo(code: string) {
    const p = dbStore.get().promotions.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
    return p && p.active ? p : null;
  },

  placeOrder(input: {
    customer: Order["customer"];
    notes?: string | undefined;
    paymentMethod: PaymentMethod;
    onlineResult?: "success" | "failure" | undefined;
  }): Order {
    const db = dbStore.get();
    const c = cartStore.get();
    const lines = c.lines
      .map((l) => {
        const it = db.menu.find((m) => m.id === l.itemId);
        return it ? { itemId: it.id, name: it.name, price: it.price, qty: l.qty, note: l.note } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    if (!lines.length) throw new Error("Your cart is empty");
    const promo = c.promo ? repo.findPromo(c.promo) : null;
    const t = computeTotals(lines, { deliveryFee: db.settings.deliveryFee, freeDeliveryOver: db.settings.freeDeliveryOver, promo });
    const at = nowIso();
    const o: Order = {
      id: `MT-${Date.now().toString().slice(-6)}`,
      customer: input.customer,
      notes: input.notes,
      lines,
      ...t,
      promoCode: promo?.code,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "online" ? (input.onlineResult === "failure" ? "failed" : "paid") : "pending",
      status: "pending",
      createdAt: at,
      updatedAt: at,
      history: [{ status: "pending", at }],
    };
    dbStore.set((d) => ({
      ...d,
      orders: [o, ...d.orders],
      notifications: [{ id: uid("n"), title: `New order ${o.id}`, body: `${o.customer.name} · ${lines.length} items`, at, read: false, orderId: o.id }, ...d.notifications].slice(0, 30),
    }));
    sessionStore.set((s) => ({ ...s, myOrders: [o.id, ...s.myOrders] }));
    cart.clear();
    return o;
  },

  setStatus(id: string, to: OrderStatus) {
    dbStore.set((d) => ({
      ...d,
      orders: d.orders.map((o) => {
        if (o.id !== id || !canTransition(o.status, to)) return o;
        const at = nowIso();
        const refund = to === "cancelled" && o.paymentStatus === "paid";
        return { ...o, status: to, updatedAt: at, history: [...o.history, { status: to, at }], paymentStatus: refund ? "refunded" : o.paymentStatus };
      }),
    }));
  },

  collectCod(id: string) {
    dbStore.set((d) => ({
      ...d,
      orders: d.orders.map((o) => (o.id === id && canCollectCod(o) ? { ...o, paymentStatus: "paid", collectedAt: nowIso(), updatedAt: nowIso() } : o)),
    }));
  },

  simulateIncoming() {
    const db = dbStore.get();
    const avail = db.menu.filter((m) => m.available);
    const names = ["Olivia Grant", "Henry Wu", "Isla Romero", "Theo Novak", "Zara Ali", "Felix Moreau"];
    const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!;
    const lines = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
      const it = pick(avail)!;
      return { itemId: it.id, name: it.name, price: it.price, qty: 1 + Math.floor(Math.random() * 2) };
    });
    const t = computeTotals(lines, { deliveryFee: db.settings.deliveryFee, freeDeliveryOver: db.settings.freeDeliveryOver });
    const at = nowIso();
    const method: PaymentMethod = Math.random() > 0.5 ? "cod" : "online";
    const o: Order = {
      id: `MT-${Date.now().toString().slice(-6)}`,
      customer: { name: pick(names), phone: "+1 415 555 01" + Math.floor(10 + Math.random() * 89), address: `${Math.floor(10 + Math.random() * 400)} Market St` },
      lines,
      ...t,
      paymentMethod: method,
      paymentStatus: method === "online" ? "paid" : "pending",
      status: "pending",
      createdAt: at,
      updatedAt: at,
      history: [{ status: "pending", at }],
      simulated: true,
    };
    dbStore.set((d) => ({
      ...d,
      orders: [o, ...d.orders],
      notifications: [{ id: uid("n"), title: `New order ${o.id} (simulated)`, body: `${o.customer.name} · ${lines.length} items`, at, read: false, simulated: true, orderId: o.id }, ...d.notifications].slice(0, 30),
    }));
    return o;
  },

  markAllRead() {
    dbStore.set((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));
  },

  saveMenuItem(item: MenuItem) {
    dbStore.set((d) => ({
      ...d,
      menu: d.menu.some((m) => m.id === item.id) ? d.menu.map((m) => (m.id === item.id ? item : m)) : [...d.menu, item],
    }));
  },
  deleteMenuItem(id: string) {
    dbStore.set((d) => ({ ...d, menu: d.menu.filter((m) => m.id !== id) }));
  },
  update(fn: (d: DB) => DB) {
    dbStore.set(fn);
  },
  newId: uid,
};
