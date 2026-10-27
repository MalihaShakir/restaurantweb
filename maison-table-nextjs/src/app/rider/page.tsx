"use client";
/**
 * /rider — Mobile-first rider dashboard.
 * Riders see ONLY their own assigned deliveries.
 * Accessible at http://localhost:3000/rider
 */
import { useEffect, useCallback, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Truck, MapPin, Phone, Package, CheckCircle2, Navigation,
  RefreshCw, LogOut, Banknote, CreditCard, MessageSquare, ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type DeliveryOrder = {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string; address: string };
  lines: { name: string; qty: number; note?: string }[];
  paymentMethod: "cod" | "online";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalCents: number;
  total: number;
  status: string;
  riderName?: string;
  assignedAt?: string;
  deliveryNotes?: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  ready:            "border-emerald-400 bg-emerald-50",
  out_for_delivery: "border-blue-400 bg-blue-50",
  delivered:        "border-gray-300 bg-gray-50 opacity-70",
};
const STATUS_LABEL: Record<string, string> = {
  ready:            "🔔 Ready for pickup",
  out_for_delivery: "🛵 Out for delivery",
  delivered:        "✅ Delivered",
};

export default function RiderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders,  setOrders]  = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState<string | null>(null);

  // Redirect if not logged in or not a rider/staff
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/admin/login");
  }, [status, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/rider/orders", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) router.replace("/admin/login");
        return;
      }
      setOrders(await res.json());
    } catch { /* network error — retry on next poll */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (status === "authenticated") {
      load();
      const t = setInterval(load, 12000);
      return () => clearInterval(t);
    }
  }, [status, load]);

  async function action(orderId: string, endpoint: string, body: Record<string, unknown>, msg: string) {
    setBusy(orderId);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Action failed"); return; }
      toast.success(msg);
      await load();
    } catch { toast.error("Network error"); }
    finally { setBusy(null); }
  }

  const pickUp   = (id: string) => action(id, `/api/v1/admin/orders/${id}/status`, { status: "out_for_delivery" }, "Picked up ✓");
  const deliver  = (id: string) => action(id, `/api/v1/admin/orders/${id}/status`, { status: "delivered" }, "Delivered ✓");
  const collectCash = (id: string) => action(id, `/api/v1/admin/orders/${id}/collect-cod`, {}, "Cash collected ✓");

  const openInMaps = (address: string) => {
    const q = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  const active    = orders.filter(o => o.status !== "delivered");
  const completed = orders.filter(o => o.status === "delivered").slice(0, 5);
  const riderName = session?.user?.name ?? "Rider";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary">
              <Truck className="size-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{riderName}</p>
              <p className="text-[11px] text-muted-foreground">Rider Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted">
              <RefreshCw className="size-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="grid size-9 place-items-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active",    value: active.length,    color: "text-blue-600" },
            { label: "Ready",     value: orders.filter(o => o.status === "ready").length, color: "text-emerald-600" },
            { label: "Delivered", value: completed.length, color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5 text-center shadow-soft">
              <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Active deliveries */}
        <section>
          <h2 className="mb-3 font-semibold text-foreground">
            Active deliveries
            {active.length === 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">— none right now</span>}
          </h2>

          {active.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
              <Truck className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No active deliveries</p>
              <p className="text-sm text-muted-foreground">New orders will appear here automatically</p>
            </div>
          )}

          <div className="space-y-4">
            {active.map(order => {
              const isBusy = busy === order._id;
              const isReady = order.status === "ready";
              const isOut   = order.status === "out_for_delivery";
              const canCollectCash = order.paymentMethod === "cod"
                && order.paymentStatus === "pending"
                && isOut;

              return (
                <div key={order._id} className={cn(
                  "rounded-2xl border-2 overflow-hidden shadow-soft",
                  STATUS_STYLE[order.status] ?? "border-border bg-card",
                )}>
                  {/* Order header */}
                  <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-black/5">
                    <div>
                      <span className="font-mono font-bold text-base">{order.orderNumber}</span>
                      <span className="ml-2 text-xs font-semibold text-muted-foreground">
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <span className="font-bold text-base">${order.total.toFixed(2)}</span>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Items</p>
                    {order.lines.map((l, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-foreground text-background text-[11px] font-bold">{l.qty}</span>
                        <div>
                          <span className="text-sm font-medium">{l.name}</span>
                          {l.note && (
                            <p className="flex items-center gap-1 text-xs text-amber-700 mt-0.5">
                              <MessageSquare className="size-3" /> {l.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.deliveryNotes && (
                    <div className="mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      📝 {order.deliveryNotes}
                    </div>
                  )}

                  {/* Customer */}
                  <div className="px-4 pb-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 shrink-0 text-terracotta mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{order.customer.address}</p>
                        <button
                          onClick={() => openInMaps(order.customer.address)}
                          className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Navigation className="size-3" /> Open in Maps
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0 text-terracotta" />
                      <a href={`tel:${order.customer.phone}`}
                        className="text-sm font-medium text-blue-600 hover:underline">
                        {order.customer.phone}
                      </a>
                      <span className="text-sm text-muted-foreground">— {order.customer.name}</span>
                    </div>
                    {/* Payment */}
                    <div className="flex items-center gap-2 text-sm">
                      {order.paymentMethod === "cod"
                        ? <Banknote className="size-4 text-amber-500" />
                        : <CreditCard className="size-4 text-blue-500" />}
                      <span className={cn("font-semibold",
                        order.paymentMethod === "cod" ? "text-amber-700" : "text-blue-700")}>
                        {order.paymentMethod === "cod" ? "CASH ON DELIVERY" : "Online — paid"}
                      </span>
                      {order.paymentStatus === "paid" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">PAID</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 space-y-2">
                    {isReady && (
                      <button
                        disabled={isBusy}
                        onClick={() => pickUp(order._id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {isBusy
                          ? <RefreshCw className="size-4 animate-spin" />
                          : <Package className="size-5" />}
                        Confirm Pickup
                      </button>
                    )}

                    {isOut && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={isBusy}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-base font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                              {isBusy
                                ? <RefreshCw className="size-4 animate-spin" />
                                : <CheckCircle2 className="size-5" />}
                              Mark Delivered
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm delivery</AlertDialogTitle>
                              <AlertDialogDescription>
                                Confirm that order <b>{order.orderNumber}</b> has been
                                successfully delivered to <b>{order.customer.name}</b>?
                                {order.paymentMethod === "cod" && order.paymentStatus === "pending" && (
                                  <span className="block mt-2 font-semibold text-amber-700">
                                    ⚠️ Remember to collect cash: ${order.total.toFixed(2)}
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Go back</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deliver(order._id)}>
                                Confirm delivery
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {canCollectCash && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                disabled={isBusy}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 py-3 text-base font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition"
                              >
                                <Banknote className="size-5" />
                                Record Cash Collected — ${order.total.toFixed(2)}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Record cash collection</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm you have collected <b>${order.total.toFixed(2)}</b> cash
                                  for order <b>{order.orderNumber}</b>.
                                  This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => collectCash(order._id)}>
                                  Confirm collection
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent completed */}
        {completed.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold text-muted-foreground text-sm">Recently delivered</h2>
            <div className="space-y-2">
              {completed.map(o => (
                <div key={o._id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <span className="font-mono text-sm font-semibold">{o.orderNumber}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{o.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-sm font-medium">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
