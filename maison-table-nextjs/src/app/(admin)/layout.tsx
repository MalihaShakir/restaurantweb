"use client";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <div className="admin-theme min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="admin-theme flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
