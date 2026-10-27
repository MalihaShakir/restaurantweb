import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <Link href="/" className="font-display mb-10 text-3xl font-semibold tracking-tight text-foreground">
        {BRAND.name}
      </Link>
      {children}
    </div>
  );
}
