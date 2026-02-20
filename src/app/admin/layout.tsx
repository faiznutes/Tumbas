"use client";

import AdminSidebar from "@/components/layout/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAuthToken } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage) {
      const token = getAuthToken();
      if (!token) {
        router.push("/admin/login");
      }
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const token = getAuthToken();
  if (!token) {
    return null;
  }

  return <AdminSidebar>{children}</AdminSidebar>;
}
