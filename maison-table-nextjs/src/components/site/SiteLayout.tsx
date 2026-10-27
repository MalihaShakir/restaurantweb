"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, ShoppingBag, User, X, MapPin, Phone, Clock, Instagram } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useCartSummary, useDB, useSession } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartLines, PromoField, TotalsBlock } from "./CartPanel";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/menu",    label: "Menu" },
  { href: "/about",   label: "Our Story" },
  { href: "/contact", label: "Visit" },
] as const;

export function SiteLayout({ children, transparent = false }: { children: ReactNode; transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCartSummary();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    const openCart = () => setOpen(true);
    window.addEventListener("maison:open-cart", openCart);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("maison:open-cart", openCart);
    };
  }, []);

  const light = transparent && !scrolled && !mobile;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", light ? "bg-transparent text-cream" : "border-b border-border bg-background/95 text-foreground backdrop-blur")}>
        <div className="container-site flex h-18 items-center justify-between py-4">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">{BRAND.name}</Link>
          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-medium opacity-85 transition hover:opacity-100">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href={session.customer ? "/account" : "/login"} aria-label="Account" className="hidden size-10 place-items-center rounded-full hover:bg-foreground/10 sm:grid">
              <User className="size-5" />
            </Link>
            <button type="button" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`} className="relative grid size-10 place-items-center rounded-full hover:bg-foreground/10">
              <ShoppingBag className="size-5" />
              {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{count}</span>}
            </button>
            <Button asChild variant="hero" size="sm" className="hidden h-10 px-5 sm:inline-flex"><Link href="/menu">Order now</Link></Button>
            <button type="button" className="grid size-10 place-items-center md:hidden" aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile} onClick={() => setMobile((v) => !v)}>
              {mobile ? <X className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav aria-label="Mobile" className="container-site flex flex-col gap-1 border-t border-border bg-background pb-6 pt-3 md:hidden">
            {NAV_LINKS.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setMobile(false)} className="font-display rounded-lg px-2 py-3 text-2xl">{n.label}</Link>
            ))}
            <Button asChild variant="hero" className="mt-3 h-12"><Link href="/menu" onClick={() => setMobile(false)}>Order now</Link></Button>
          </nav>
        )}
      </header>

      <main id="main" className={cn("flex-1", !transparent && "pt-18")}>{children}</main>

      <Footer />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col bg-background sm:max-w-md">
          <SheetHeader><SheetTitle className="font-display text-3xl font-semibold">Your order</SheetTitle></SheetHeader>
          <div className="-mx-6 flex-1 overflow-y-auto px-6"><CartLines compact /></div>
          {count > 0 && (
            <div className="space-y-4 border-t border-border pt-4">
              <PromoField />
              <TotalsBlock />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12 rounded-full" onClick={() => { setOpen(false); router.push("/cart"); }}>View cart</Button>
                <Button variant="hero" className="h-12" onClick={() => { setOpen(false); router.push("/checkout"); }}>Checkout</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Footer() {
  const { settings } = useDB();
  return (
    <footer className="bg-espresso text-cream">
      <div className="container-site grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-4xl">{BRAND.name}</p>
          <p className="mt-3 max-w-sm text-sm text-cream/70">{BRAND.tagline}. {settings.about}</p>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm text-cream/80 hover:text-gold"><Instagram className="size-4" /> @maisontable</a>
        </div>
        <div className="space-y-3 text-sm text-cream/80">
          <p className="eyebrow text-gold">Visit</p>
          <p className="flex gap-2"><MapPin className="size-4 shrink-0 text-gold" />{settings.address}</p>
          <p className="flex gap-2"><Phone className="size-4 shrink-0 text-gold" />{settings.phone}</p>
          <p className="flex gap-2"><Clock className="size-4 shrink-0 text-gold" />Tue–Sun · from 5pm</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-cream/80">
          <p className="eyebrow text-gold">Explore</p>
          <Link href="/menu" className="hover:text-gold">Menu</Link>
          <Link href="/about" className="hover:text-gold">Our story</Link>
          <Link href="/contact" className="hover:text-gold">Contact</Link>
          <Link href="/account/orders" className="hover:text-gold">My orders</Link>
          <Link href="/admin/login" className="hover:text-gold">Staff login</Link>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <p className="container-site py-5 text-xs text-cream/50">© 2026 {BRAND.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="container-site pb-10 pt-14 md:pt-20">
      <p className="eyebrow reveal">{eyebrow}</p>
      <h1 className="reveal mt-3 max-w-3xl text-5xl font-medium leading-[1.02] md:text-7xl">{title}</h1>
      {children && <div className="reveal mt-5 max-w-2xl text-lg text-muted-foreground">{children}</div>}
    </section>
  );
}
