import Image from "next/image";
import Link from "next/link";
import storyImg from "@/assets/story.jpg";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "Our Story — Maison Table",
  description: "A neighbourhood kitchen cooking seasonal food over fire since 2014.",
};

export default function AboutPage() {
  return (
    <>
      <section className="container-site pb-10 pt-14 md:pt-20">
        <p className="eyebrow reveal">Our story</p>
        <h1 className="reveal mt-3 max-w-3xl text-5xl font-medium leading-[1.02] md:text-7xl">A neighbourhood table, since 2014.</h1>
        <p className="reveal mt-5 max-w-2xl text-lg text-muted-foreground">We started with twelve seats, one wood oven and a belief that good food is mostly patience.</p>
      </section>
      <section className="container-site grid gap-16 pb-24 md:grid-cols-2">
        <Image src={storyImg} alt="Chef plating at the open kitchen" width={1200} height={1408} className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift" />
        <div className="flex flex-col justify-center gap-6">
          <p className="text-lg text-muted-foreground">A decade later the oven is bigger — the patience hasn&apos;t changed. Every dish starts with what the farms brought in this week, passes through a kitchen that takes its time, and arrives at your door the way it left the pass: warm, composed, and worth it.</p>
          <p className="text-lg text-muted-foreground">We cook over almond wood. We roll our pasta each morning. We make the desserts we want to eat. That&apos;s about all there is to it.</p>
          <p className="font-display text-2xl italic text-muted-foreground">— {BRAND.name}, {BRAND.address}</p>
          <Link href="/menu" className="inline-flex w-fit items-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90">Order now</Link>
        </div>
      </section>
    </>
  );
}
