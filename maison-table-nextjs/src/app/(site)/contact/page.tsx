"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import { useDB } from "@/lib/store";
import { PageHeader } from "@/components/site/SiteLayout";

export default function ContactPage() {
  const { settings } = useDB();
  return (
    <>
      <PageHeader eyebrow="Visit us" title="Find Maison Table">
        Come in for supper, or order delivery from the comfort of your home.
      </PageHeader>
      <section className="container-site grid gap-12 pb-24 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="flex items-center gap-3 text-sm"><MapPin className="size-4 text-terracotta shrink-0" />{settings.address}</p>
            <p className="flex items-center gap-3 text-sm"><Phone className="size-4 text-terracotta shrink-0" /><a href={`tel:${settings.phone}`} className="hover:text-terracotta">{settings.phone}</a></p>
            <p className="flex items-center gap-3 text-sm"><Mail className="size-4 text-terracotta shrink-0" /><a href={`mailto:${settings.email}`} className="hover:text-terracotta">{settings.email}</a></p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-2xl font-semibold">Hours</h2>
            <dl className="divide-y divide-border">
              {settings.hours.map((h) => (
                <div key={h.day} className="flex justify-between py-2.5 text-sm">
                  <dt className="font-medium">{h.day}</dt>
                  <dd className="tabular-nums text-muted-foreground">{h.closed ? "Closed" : `${h.open} – ${h.close}`}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Map to Maison Table"
            loading="lazy"
            className="h-full min-h-[400px] w-full grayscale-[60%] sepia-[25%]"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-122.43%2C37.77%2C-122.42%2C37.78&layer=mapnik"
          />
        </div>
      </section>
    </>
  );
}
