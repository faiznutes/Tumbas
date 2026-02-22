"use client";

import AdminSidebar from "@/components/layout/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";
import { getCurrentAdminUser, hasAdminPermission, hasAnyAdminPermission, setCurrentAdminUser } from "@/lib/admin-permissions";

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
    return hasAnyAdminPermission([
      "settings.view",
      "settings.edit",
      "settings.general.view",
      "settings.general.edit",
      "settings.store.view",
      "settings.store.edit",
      "settings.notifications.view",
      "settings.notifications.edit",
      "settings.promo.view",
      "settings.promo.edit",
      "settings.weekly.view",
      "settings.weekly.edit",
      "settings.featured.view",
      "settings.featured.edit",
      "settings.payment.view",
      "settings.payment.edit",
      "settings.shipping.view",
      "settings.shipping.edit",
      "settings.notice.view",
      "settings.notice.edit",
    ]);
  }
  if (pathname.startsWith("/admin/webhooks")) {
    return role === "SUPER_ADMIN";
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
  const [sessionChecked, setSessionChecked] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;
    const syncSession = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) setSessionChecked(true);
        return;
      }

      try {
        const latestUser = await api.auth.me();
        setCurrentAdminUser(latestUser);
      } catch {
        // handled by api layer redirect logic for 401
      } finally {
        if (isMounted) setSessionChecked(true);
      }
    };

    syncSession();
    window.addEventListener("focus", syncSession);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncSession);
    };
  }, [isLoginPage]);

  useEffect(() => {
    if (!sessionChecked) return;
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
  }, [pathname, isLoginPage, router, sessionChecked]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!sessionChecked) {
    return null;
  }

  const token = getAuthToken();
  if (!token) {
    return null;
  }

  return <AdminSidebar>{children}</AdminSidebar>;
}
