"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ShoppingBag, LogOut, ChevronRight, Clock } from "lucide-react";
import { useSession, useDB, sessionStore } from "@/lib/store";
import { PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { fmt } from "@/lib/brand";
import { format } from "date-fns";
import { DemoBadge } from "@/components/badges";

export default function AccountPage() {
  const router = useRouter();
  const session = useSession();
  const db = useDB();

  useEffect(() => {
    if (!session.customer) router.replace("/login");
  }, [session.customer, router]);

  if (!session.customer) return null;

  const recentOrders = session.myOrders
    .map((id) => db.orders.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .slice(0, 3);

  return (
    <>
      <PageHeader eyebrow="Your account" title={`Hello, ${session.customer.name.split(" ")[0]}.`} />

      <section className="container-site pb-32 space-y-8 max-w-2xl">
        <DemoBadge>Demo account — stored in this browser only</DemoBadge>

        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="flex items-center gap-5 border-b border-border bg-secondary/40 p-6">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
              {session.customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold">{session.customer.name}</p>
              <p className="text-sm text-muted-foreground">{session.customer.email}</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-6 py-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" /> Full name
              </span>
              <span className="font-medium">{session.customer.name}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="size-4" /> Total orders
              </span>
              <span className="font-medium">{session.myOrders.length}</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/account/orders"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition hover:border-terracotta hover:shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-primary/10">
                <ShoppingBag className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">My orders</p>
                <p className="text-xs text-muted-foreground">{session.myOrders.length} orders placed</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link
            href="/menu"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition hover:border-terracotta hover:shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-primary/10">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Order again</p>
                <p className="text-xs text-muted-foreground">Browse the menu</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent orders</h2>
              <Link href="/account/orders" className="text-sm font-medium text-terracotta hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/order/${o.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-terracotta hover:shadow-soft"
                >
                  <div>
                    <p className="font-semibold text-sm">{o.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(o.createdAt), "MMM d, h:mm a")} · {fmt(o.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            sessionStore.set((s) => ({ ...s, customer: null, myOrders: [] }));
            router.push("/");
          }}
        >
          <LogOut className="size-4 mr-2" /> Sign out
        </Button>
      </section>
    </>
  );
}
