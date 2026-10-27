"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Tag, CreditCard, BarChart3,
  Settings, LogOut, ChefHat, Users, Ticket, Menu, X, Truck,
  UserCog, ExternalLink, FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

const ALL_LINKS = [
  { href: "/admin/dashboard",  label: "Dashboard",   Icon: LayoutDashboard, roles: ["admin","staff","superadmin"] },
  { href: "/admin/orders",     label: "Orders",       Icon: ShoppingBag,     roles: ["admin","staff","superadmin"], badge: true },
  { href: "/admin/kitchen",    label: "Kitchen",      Icon: ChefHat,         roles: ["admin","staff","superadmin"] },
  { href: "/admin/delivery",   label: "Delivery",     Icon: Truck,           roles: ["admin","staff","superadmin"] },
  { href: "/admin/menu",       label: "Menu",         Icon: UtensilsCrossed, roles: ["admin","superadmin"] },
  { href: "/admin/categories", label: "Categories",   Icon: Tag,             roles: ["admin","superadmin"] },
  { href: "/admin/riders",     label: "Riders",       Icon: Users,           roles: ["admin","superadmin"] },
  { href: "/admin/staff",      label: "Staff",        Icon: UserCog,         roles: ["admin","superadmin"] },
  { href: "/admin/payments",   label: "Payments",     Icon: CreditCard,      roles: ["admin","superadmin"] },
  { href: "/admin/reports",    label: "Reports",      Icon: FileBarChart,    roles: ["admin","superadmin"] },
  { href: "/admin/analytics",  label: "Analytics",    Icon: BarChart3,       roles: ["admin","superadmin"] },
  { href: "/admin/promotions", label: "Promotions",   Icon: Ticket,          roles: ["admin","superadmin"] },
  { href: "/admin/settings",   label: "Settings",     Icon: Settings,        roles: ["admin","superadmin"] },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/admin/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar min-h-screen items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-sidebar-primary border-t-transparent" />
      </aside>
    );
  }
  if (!session) return null;

  const userRole  = (session.user as { role?: string }).role ?? "staff";
  const userName  = session.user?.name  ?? "Staff";
  const userEmail = session.user?.email ?? "";

  const links = ALL_LINKS.filter(l => (l.roles as readonly string[]).includes(userRole));

  const handleSignOut = () => signOut({ callbackUrl: "/admin/login" });

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-5 border-b border-sidebar-border">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary">
          <ChefHat className="size-4 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{BRAND.name}</p>
          <p className="truncate text-[11px] text-sidebar-foreground/50 capitalize">{userRole}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {links.map(({ href, label, Icon, ...rest }) => {
          const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
              )}>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-sidebar-foreground truncate">{userName}</p>
          <p className="text-[11px] text-sidebar-foreground/50 truncate">{userEmail}</p>
        </div>
        <Link href="/" target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors">
          <ExternalLink className="size-4" /> View website
        </Link>
        <button onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/65 hover:bg-destructive/20 hover:text-destructive transition-colors">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar min-h-screen">
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 h-14">
        <div className="flex items-center gap-2">
          <ChefHat className="size-4 text-sidebar-primary" />
          <span className="text-sm font-semibold text-sidebar-foreground">{BRAND.name}</span>
        </div>
        <button onClick={() => setOpen(v => !v)}
          className="grid size-9 place-items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/40"
          aria-label="Toggle menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-14 bottom-0 w-64 flex flex-col border-r border-sidebar-border bg-sidebar overflow-y-auto">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
