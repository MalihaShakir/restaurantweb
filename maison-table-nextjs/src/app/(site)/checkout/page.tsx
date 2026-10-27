"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Banknote, CreditCard, Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/SiteLayout";
import { CartLines, TotalsBlock } from "@/components/site/CartPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { repo, useCartSummary, useSession } from "@/lib/store";
import { fmt } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/types";

const schema = z.object({
  name:    z.string().trim().min(2,  "Please enter your full name").max(80),
  phone:   z.string().trim().regex(/^[+\d][\d\s()-]{6,19}$/, "Enter a valid phone number"),
  address: z.string().trim().min(6,  "Enter a full delivery address").max(200),
  notes:   z.string().trim().max(300).optional(),
});
type Form = z.infer<typeof schema>;

export default function Checkout() {
  const { count, totals, settings } = useCartSummary();
  const session  = useSession();
  const router   = useRouter();
  const [form,    setForm]    = useState<Form>({ name: "", phone: "", address: "", notes: "" });
  const [errors,  setErrors]  = useState<Partial<Record<keyof Form, string>>>({});
  const [method,  setMethod]  = useState<PaymentMethod>("cod");
  const [gateway, setGateway] = useState(false);
  const [busy,    setBusy]    = useState(false);

  // Pre-fill name from session
  useEffect(() => {
    if (session.customer)
      setForm((f) => (f.name ? f : { ...f, name: session.customer!.name }));
  }, [session.customer]);

  const place = (onlineResult?: "success" | "failure") => {
    setBusy(true);
    setTimeout(() => {
      try {
        const o = repo.placeOrder({
          customer:      { name: form.name, phone: form.phone, address: form.address },
          notes:         form.notes || undefined,
          paymentMethod: method,
          onlineResult,
        });
        if (o.paymentStatus === "failed")
          toast.error("Simulated payment failed — order saved as unpaid.");
        else
          toast.success(`Order ${o.id} placed! It now appears in the admin dashboard.`);
        router.push(`/order/${o.id}`);
      } catch (e) {
        toast.error((e as Error).message);
        setBusy(false);
      }
    }, 700);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] = i.message));
      setErrors(errs);
      toast.error("Please check the highlighted fields");
      return;
    }
    setErrors({});
    if (totals.subtotal < settings.minOrder) {
      toast.error(`Minimum order is ${fmt(settings.minOrder)}`);
      return;
    }
    if (method === "online") setGateway(true);
    else place();
  };

  // Empty cart
  if (count === 0)
    return (
      <>
        <PageHeader eyebrow="Checkout" title="Nothing to check out yet" />
        <div className="container-site pb-24 max-w-sm">
          <p className="mb-6 text-muted-foreground">Add some dishes to your cart before checking out.</p>
          <Button asChild variant="hero" size="xl"><Link href="/menu">Browse the menu →</Link></Button>
        </div>
      </>
    );

  // Kitchen closed
  if (!settings.acceptingOrders)
    return (
      <>
        <PageHeader eyebrow="Checkout" title="We're not accepting orders right now" />
        <div className="container-site pb-24 max-w-md">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-6">
            <AlertTriangle className="size-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Kitchen is currently closed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Online ordering is paused. You can still browse the menu and come back when we re-open.
                Check our opening hours for the next available time.
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="hero"><Link href="/menu">View menu</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link href="/contact">Opening hours</Link></Button>
          </div>
        </div>
      </>
    );

  const field = (k: keyof Form, label: string, el: React.ReactNode) => (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{el}</div>
      {errors[k] && <p className="mt-1 text-xs text-destructive" role="alert">{errors[k]}</p>}
    </label>
  );
  const set = (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader eyebrow="Almost there" title="Checkout" />

      <form onSubmit={submit} noValidate className="container-site grid gap-10 pb-32 lg:grid-cols-[1fr_400px]">
        {/* Left: form */}
        <div className="space-y-8">
          <fieldset className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8">
            <legend className="font-display px-1 text-3xl">Delivery details</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              {field("name",  "Full name",
                <Input value={form.name}  onChange={set("name")}  autoComplete="name"           aria-invalid={!!errors.name}  className="h-11 bg-background" />)}
              {field("phone", "Phone number",
                <Input value={form.phone} onChange={set("phone")} type="tel" autoComplete="tel" aria-invalid={!!errors.phone} className="h-11 bg-background" placeholder="+1 415 555 0100" />)}
            </div>
            {field("address", "Delivery address",
              <Input value={form.address} onChange={set("address")} autoComplete="street-address" aria-invalid={!!errors.address} className="h-11 bg-background" placeholder="Street, apartment, city" />)}
            {field("notes", "Delivery instructions (optional)",
              <Textarea value={form.notes} onChange={set("notes")} maxLength={300} className="bg-background" placeholder="Gate code, leave at door, ring the bell…" />)}
          </fieldset>

          <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8">
            <legend className="font-display px-1 text-3xl">Payment</legend>
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
              {([
                { v: "cod",    t: "Cash on delivery",   d: "Pay the rider when your food arrives.", I: Banknote },
                { v: "online", t: "Online payment",      d: "Simulated checkout — no real charge.",   I: CreditCard },
              ] as const).map((o) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === o.v}
                  key={o.v}
                  onClick={() => setMethod(o.v)}
                  className={cn(
                    "flex gap-4 rounded-xl border p-4 text-left transition",
                    method === o.v
                      ? "border-terracotta bg-terracotta/5 ring-1 ring-terracotta"
                      : "border-border hover:border-gold",
                  )}
                >
                  <o.I className="mt-0.5 size-5 shrink-0 text-terracotta" />
                  <span>
                    <span className="block font-semibold">{o.t}</span>
                    <span className="text-sm text-muted-foreground">{o.d}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Right: order summary */}
        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-3xl font-medium">Your order</h2>
          <div className="max-h-72 overflow-y-auto">
            <CartLines compact />
          </div>
          <TotalsBlock />
          <Button type="submit" variant="hero" className="h-13 w-full text-base" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {method === "online"
              ? "Continue to payment"
              : `Place order · ${fmt(totals.total)}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo store — orders are saved only in this browser.
            Different devices will not synchronise.
          </p>
        </aside>
      </form>

      {/* Simulated payment gateway */}
      <Dialog open={gateway} onOpenChange={(o) => !busy && setGateway(o)}>
        <DialogContent className="bg-background">
          <div className="flex items-center gap-2 rounded-lg bg-gold/20 px-3 py-2 text-xs font-semibold text-espresso">
            <ShieldAlert className="size-4" />
            SIMULATED CHECKOUT — no card is charged, no payment provider is connected.
          </div>
          <DialogTitle className="font-display text-3xl">Demo payment</DialogTitle>
          <DialogDescription>
            Amount: <b className="text-foreground">{fmt(totals.total)}</b>.
            Choose an outcome to test the full order flow.
          </DialogDescription>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="hero" className="h-11" disabled={busy} onClick={() => place("success")}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Simulate success
            </Button>
            <Button variant="outline" className="h-11 rounded-full" disabled={busy} onClick={() => place("failure")}>
              Simulate failure
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
