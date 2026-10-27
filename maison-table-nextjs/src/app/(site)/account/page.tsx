"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, ShoppingBag, LogOut, ChevronRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
      Loading…
    </div>
  );

  if (!session?.user) return null;

  const name  = session.user.name  ?? "Guest";
  const email = session.user.email ?? "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      <PageHeader eyebrow="Your account" title={`Hello, ${name.split(" ")[0]}.`} />

      <section className="container-site pb-32 space-y-8 max-w-2xl">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="flex items-center gap-5 border-b border-border bg-secondary/40 p-6">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
              {initial}
            </div>
            <div>
              <p className="text-xl font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-6 py-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" /> Full name
              </span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" /> Email
              </span>
              <span className="font-medium">{email}</span>
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
                <p className="text-xs text-muted-foreground">View order history</p>
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

        {/* Sign out */}
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-4 mr-2" /> Sign out
        </Button>
      </section>
    </>
  );
}
