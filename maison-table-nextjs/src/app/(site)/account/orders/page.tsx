"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, ShoppingBag, ChevronRight, Banknote, CreditCard } from "lucide-react";
import { useSession, useDB } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { StatusBadge, PaymentBadge } from "@/components/badges";
import { PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export default function AccountOrdersPage() {
  const router = useRouter();
  const session = useSession();
  const db = useDB();

  useEffect(() => {
    if (!session.customer) router.replace("/login");
  }, [session.customer, router]);

  if (!session.customer) return null;

  const orders = session.myOrders
    .map((id) => db.orders.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => !!o);

  return (
    <>
      <PageHeader eyebrow="Your account" title="My orders">
        {orders.length > 0
          ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} placed`
          : "No orders yet"}
      </PageHeader>

      <section className="container-site pb-32 max-w-3xl">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-3.5" /> Back to account
        </Link>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card p-14 text-center shadow-soft">
            <div className="grid size-20 place-items-center rounded-full bg-muted">
              <ShoppingBag className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-3xl font-medium">No orders yet</p>
              <p className="mt-2 text-muted-foreground max-w-xs">
                Your order history will appear here after you place your first order.
              </p>
            </div>
            <Button asChild variant="hero" size="xl">
              <Link href="/menu">Browse the menu →</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/order/${o.id}`}
                className="group block rounded-2xl border border-border bg-card transition-all hover:border-terracotta hover:shadow-soft"
              >
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
                  <div>
                    <p className="font-semibold">{o.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(o.createdAt), "MMMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={o.status} />
                    <PaymentBadge status={o.paymentStatus} />
                    <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Order body */}
                <div className="px-6 py-4">
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                  </p>
                </div>

                {/* Order footer */}
                <div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    {o.paymentMethod === "cod" ? (
                      <><Banknote className="size-3.5" /> Cash on delivery</>
                    ) : (
                      <><CreditCard className="size-3.5" /> Online payment</>
                    )}
                  </div>
                  <p className="font-semibold tabular-nums">{fmt(o.total)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
