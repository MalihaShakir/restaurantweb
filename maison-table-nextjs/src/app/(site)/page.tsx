"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Clock, MapPin, Flame } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import storyImg from "@/assets/story.jpg";
import { DishCard } from "@/components/site/DishCard";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { BRAND, fmt } from "@/lib/brand";

const TESTIMONIALS = [
  { q: "The short rib tagliatelle arrived steaming and tasted like we were sitting at the pass.", n: "Hannah R.", r: "Hayes Valley" },
  { q: "Every detail feels considered — the packaging, the notes, the timing. Our Friday ritual.", n: "Daniel O.", r: "Mission" },
  { q: "Finally, delivery that doesn't compromise. The ribeye is worth every cent.", n: "Priya S.", r: "NoPa" },
];

export default function Home() {
  const db = useDB();
  const best = db.menu.filter((m) => m.bestSeller).slice(0, 4);
  const chef = db.menu.filter((m) => m.chefPick).slice(0, 3);
  const signature = db.menu.find((m) => m.id === "m1") ?? db.menu[0]!;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate min-h-[92svh] overflow-hidden bg-espresso text-cream">
        <Image src={heroImg} alt="Short rib tagliatelle with parmesan on a stone plate" fill priority className="absolute inset-0 -z-10 object-cover opacity-80 md:left-1/3 md:w-2/3" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso via-espresso/80 to-transparent" />
        <div className="container-site flex min-h-[92svh] flex-col justify-end pb-16 pt-32 md:justify-center md:pb-0">
          <p className="eyebrow reveal text-gold">{BRAND.tagline} · San Francisco</p>
          <h1 className="reveal mt-5 max-w-2xl text-6xl font-medium leading-[0.95] md:text-8xl">
            Slow food, <em className="text-gold">delivered</em> warm.
          </h1>
          <p className="reveal mt-6 max-w-md text-lg text-cream/80">Hand-rolled pasta, wood-fired mains and a pastry kitchen that never cuts corners — now at your table.</p>
          <div className="reveal mt-9 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl"><Link href="/menu">Order now <ArrowRight /></Link></Button>
            <Button asChild variant="ghostLight" size="xl"><Link href="/about">Our story</Link></Button>
          </div>
          <dl className="reveal mt-14 flex flex-wrap gap-x-10 gap-y-4 text-sm text-cream/75">
            <div className="flex items-center gap-2"><Clock className="size-4 text-gold" /><dt className="sr-only">Delivery time</dt><dd>~{db.settings.etaMinutes} min delivery</dd></div>
            <div className="flex items-center gap-2"><Star className="size-4 text-gold" /><dt className="sr-only">Rating</dt><dd>4.9 from 2,300 guests</dd></div>
            <div className="flex items-center gap-2"><MapPin className="size-4 text-gold" /><dt className="sr-only">Area</dt><dd>{db.settings.deliveryRadiusKm} km radius</dd></div>
          </dl>
        </div>
      </section>

      {/* Categories */}
      <section aria-label="Browse by category" className="border-b border-border">
        <div className="container-site flex gap-3 overflow-x-auto py-6">
          {db.categories.map((c) => (
            <Link key={c.id} href={`/menu?c=${c.slug}`} className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-terracotta hover:text-terracotta">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Signature */}
      <section className="container-site grid items-center gap-12 py-24 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl shadow-lift">
          <img src={signature.image} alt={signature.name} loading="lazy" className="aspect-[5/4] w-full object-cover" />
        </div>
        <div>
          <p className="eyebrow">Signature dish</p>
          <h2 className="mt-3 text-5xl font-medium leading-tight md:text-6xl">{signature.name}</h2>
          <p className="mt-5 text-lg text-muted-foreground">{signature.description} Twelve hours on the bone, finished in our own stock and tossed with ribbons rolled that morning.</p>
          <div className="mt-8 flex items-center gap-6">
            <span className="font-display text-4xl">{fmt(signature.price)}</span>
            <Button asChild variant="hero" size="xl"><Link href={`/menu/${signature.slug}`}>View dish</Link></Button>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="bg-secondary/60 py-24">
        <div className="container-site">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Most loved</p>
              <h2 className="mt-3 text-5xl font-medium">Best sellers</h2>
            </div>
            <Link href="/menu" className="hidden items-center gap-2 text-sm font-semibold text-terracotta hover:underline sm:inline-flex">Full menu <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{best.map((m) => <DishCard key={m.id} item={m} />)}</div>
        </div>
      </section>

      {/* Chef picks */}
      <section className="container-site py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">From the pass</p>
            <h2 className="mt-3 text-5xl font-medium leading-tight">Chef Marco&apos;s recommendations</h2>
            <p className="mt-5 text-muted-foreground">Three plates our kitchen is proudest of this season — built around what the farms brought in this week.</p>
            <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium"><Flame className="size-4 text-terracotta" /> Cooked over almond wood</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">{chef.map((m) => <DishCard key={m.id} item={m} />)}</div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-espresso text-cream">
        <div className="container-site grid items-center gap-12 py-24 md:grid-cols-2">
          <Image src={storyImg} alt="Chef plating at the open kitchen" loading="lazy" width={1200} height={1408} className="aspect-[4/5] w-full rounded-3xl object-cover" />
          <div>
            <p className="eyebrow text-gold">Our story</p>
            <h2 className="mt-3 text-5xl font-medium leading-tight md:text-6xl">A neighbourhood table, since 2014.</h2>
            <p className="mt-6 text-lg text-cream/75">We started with twelve seats, one wood oven and a belief that good food is mostly patience. A decade later the oven is bigger — the patience hasn&apos;t changed.</p>
            <Button asChild variant="cream" size="xl" className="mt-9"><Link href="/about">Read more</Link></Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-site py-24">
        <p className="eyebrow text-center">Kind words</p>
        <h2 className="mt-3 text-center text-5xl font-medium">From our guests</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.n} className="rounded-2xl border border-border bg-card p-8 shadow-soft">
              <div className="flex gap-0.5 text-gold" aria-label="5 stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-current" />)}</div>
              <blockquote className="font-display mt-5 text-2xl leading-snug">&ldquo;{t.q}&rdquo;</blockquote>
              <figcaption className="mt-6 text-sm text-muted-foreground"><b className="text-foreground">{t.n}</b> · {t.r}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Hours & location */}
      <section className="border-t border-border bg-secondary/60">
        <div className="container-site grid gap-12 py-20 md:grid-cols-2">
          <div>
            <p className="eyebrow">Opening hours</p>
            <h2 className="mt-3 text-4xl font-medium">Kitchen hours</h2>
            <dl className="mt-8 divide-y divide-border border-y border-border">
              {db.settings.hours.map((h) => (
                <div key={h.day} className="flex justify-between py-3 text-sm">
                  <dt className="font-medium">{h.day}</dt>
                  <dd className="tabular-nums text-muted-foreground">{h.closed ? "Closed" : `${h.open} – ${h.close}`}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="eyebrow">Find us</p>
            <h2 className="mt-3 text-4xl font-medium">{db.settings.address}</h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <iframe title="Map to Maison Table" loading="lazy" className="h-72 w-full grayscale-[60%] sepia-[25%]" src="https://www.openstreetmap.org/export/embed.html?bbox=-122.43%2C37.77%2C-122.42%2C37.78&layer=mapnik" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
