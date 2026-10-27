import { SiteLayout } from "@/components/site/SiteLayout";
import type { ReactNode } from "react";

export default function SiteGroupLayout({ children }: { children: ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
