"use client";
/**
 * Kitchen Display — tablet-friendly, auto-refreshes every 8s.
 * Roles: kitchen_staff (mapped to "staff"), admin, superadmin.
 * No financial data shown.
 */
import { useEffect, useCallback, useState } from "react";
import { format } from "date-fns";
import { RefreshCw, ChefHat, MessageSquare, Volume2, VolumeX, Clock } from "lucide-react";
import type { ApiOrder } from "@/hooks/useAdminOrders";
import { useOrderActions, useNewOrderAlert } from "@/hooks/useOrderActions";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const KITCHEN_STATUSES = ["pending","confirmed","preparing","ready"] as const;
type KS = typeof KITCHEN_STATUSES[number];

const COL: Record<KS, { bg: string; border: string; badge: string; label: string }> = {
  pending:   { bg:"bg-amber-50",   border:"border-amber-400",  badge:"bg-amber-500 text-white",   label:"🆕 New" },
  confirmed: { bg:"bg-blue-50",    border:"border-blue-400",   badge:"bg-blue-600 text-white",    label:"✓ Accepted" },
  preparing: { bg:"bg-orange-50",  border:"border-orange-400", badge:"bg-orange-500 text-white",  label:"🍳 Preparing" },
  ready:     { bg:"bg-emerald-50", border:"border-emerald-400",badge:"bg-emerald-600 text-white", label:"🔔 Ready" },
};
const NEXT_ACTION: Record<KS,{ next:string; label:string; cls:string }|null> = {
  pending:   { next:"confirmed", label:"✓ Accept",         cls:"bg-blue-600 hover:bg-blue-700 text-white" },
  confirmed: { next:"preparing", label:"🍳 Start cooking",  cls:"bg-orange-500 hover:bg-orange-600 text-white" },
  preparing: { next:"ready",     label:"🔔 Mark ready",     cls:"bg-emerald-600 hover:bg-emerald-700 text-white" },
  ready:     null,
};

export default function KitchenPage() {
  const [orders,  setOrders]  = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAt,  setLastAt]  = useState(new Date());
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/kitchen/orders", { credentials:"include" });
      if (res.status === 401) { setError("Session expired — please sign in"); return; }
      if (!res.ok) { setError("Failed to load kitchen orders"); return; }
      setOrders(await res.json());
      setLastAt(new Date());
      setError("");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const { busy, updateStatus } = useOrderActions(load);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const { muted, toggleMute } = useNewOrderAlert(pendingCount);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ChefHat className="size-6 text-terracotta" />
          <h1 className="text-2xl font-bold">Kitchen</h1>
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {orders.length} active · {format(lastAt,"h:mm:ss a")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} title={muted?"Unmute alerts":"Mute alerts"}
            className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted">
            {muted ? <VolumeX className="size-4 text-muted-foreground"/> : <Volume2 className="size-4"/>}
          </button>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")}/>
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {!loading && orders.length === 0 && !error && (
        <div className="py-24 text-center">
          <ChefHat className="mx-auto size-16 text-muted-foreground/40 mb-4"/>
          <p className="text-xl font-medium text-muted-foreground">Kitchen is clear</p>
          <p className="text-sm text-muted-foreground mt-1">New orders appear here automatically</p>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KITCHEN_STATUSES.map(st => {
          const col = orders.filter(o => o.status === st);
          const style = COL[st];
          const action = NEXT_ACTION[st];
          return (
            <div key={st}>
              <div className={cn("mb-3 flex items-center justify-between rounded-lg border px-3 py-2", style.bg, style.border)}>
                <span className="font-bold text-sm">{style.label}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", style.badge)}>{col.length}</span>
              </div>
              <div className="space-y-3">
                {col.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Empty</p>}
                {col.map(order => {
                  const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                  const overdue = mins > 20;
                  return (
                    <div key={order._id} className={cn("rounded-xl border-2 p-4 space-y-3 bg-card transition-all",
                      overdue ? "border-red-400 shadow-md" : style.border)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold">{order.orderNumber}</span>
                        <span className={cn("flex items-center gap-1 text-xs font-semibold",
                          overdue ? "text-red-600" : "text-muted-foreground")}>
                          <Clock className="size-3"/>{mins}m
                          {overdue && " ⚠️"}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {order.lines.map((l, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-background text-sm font-bold">{l.qty}</span>
                            <div className="text-sm">
                              <p className="font-semibold leading-tight">{l.name}</p>
                              {l.note && <p className="flex items-center gap-1 text-xs text-amber-700 mt-0.5"><MessageSquare className="size-3"/>{l.note}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {order.deliveryNotes && (
                        <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                          📝 {order.deliveryNotes}
                        </p>
                      )}
                      {action && (
                        st === "pending" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button disabled={busy===order._id}
                                className={cn("w-full rounded-lg py-2.5 text-sm font-bold transition disabled:opacity-50", action.cls)}>
                                {action.label}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Accept order {order.orderNumber}?</AlertDialogTitle>
                                <AlertDialogDescription>Confirm to start the kitchen workflow.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={() => updateStatus(order._id, action.next)}>Accept</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <button disabled={busy===order._id}
                            onClick={() => updateStatus(order._id, action.next)}
                            className={cn("w-full rounded-lg py-2.5 text-sm font-bold transition disabled:opacity-50", action.cls)}>
                            {action.label}
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
