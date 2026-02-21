"use client";

import AdminSidebar from "@/components/layout/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAuthToken } from "@/lib/api";
import { getCurrentAdminUser, hasAdminPermission } from "@/lib/admin-permissions";

function canAccessAdminPath(pathname: string) {
  const user = getCurrentAdminUser();
  const role = user.role || "";

  if (!pathname.startsWith("/admin")) return true;
  if (pathname === "/admin/login") return true;
  if (pathname === "/admin" || pathname === "/admin/dashboard") return true;

  if (pathname.startsWith("/admin/users")) {
    return role === "SUPER_ADMIN";
  }
  if (pathname.startsWith("/admin/orders")) {
    return hasAdminPermission("orders.view");
  }
  if (pathname.startsWith("/admin/customers")) {
    return hasAdminPermission("orders.view");
  }
  if (pathname.startsWith("/admin/products")) {
    return hasAdminPermission("products.edit");
  }
  if (pathname.startsWith("/admin/messages")) {
    return hasAdminPermission("messages.view");
  }
  if (pathname.startsWith("/admin/settings")) {
    return hasAdminPermission("settings.view") || hasAdminPermission("settings.edit");
  }
  if (pathname.startsWith("/admin/webhooks")) {
    return hasAdminPermission("reports.view");
  }

  return true;
}

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
        return;
      }

      if (!canAccessAdminPath(pathname)) {
        router.push("/admin/dashboard?forbidden=1");
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
