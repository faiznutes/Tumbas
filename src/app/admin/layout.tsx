"use client";

import AdminSidebar from "@/components/layout/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";
import { ADMIN_SESSION_UPDATED_EVENT, getCurrentAdminUser, hasAdminPermission, hasAnyAdminPermission, setCurrentAdminUser } from "@/lib/admin-permissions";

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
  if (pathname.startsWith("/admin/categories")) {
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
  const [sessionRevision, setSessionRevision] = useState(0);

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
        if (isMounted) setSessionRevision((prev) => prev + 1);
      } catch {
        // handled by api layer redirect logic for 401
      } finally {
        if (isMounted) setSessionChecked(true);
      }
    };

    const syncFromEvent = () => {
      setSessionRevision((prev) => prev + 1);
    };

    syncSession();
    window.addEventListener("focus", syncSession);
    window.addEventListener("visibilitychange", syncSession);
    window.addEventListener(ADMIN_SESSION_UPDATED_EVENT, syncFromEvent);
    window.addEventListener("storage", syncFromEvent);
    const interval = window.setInterval(syncSession, 20000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("visibilitychange", syncSession);
      window.removeEventListener(ADMIN_SESSION_UPDATED_EVENT, syncFromEvent);
      window.removeEventListener("storage", syncFromEvent);
      window.clearInterval(interval);
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
  }, [pathname, isLoginPage, router, sessionChecked, sessionRevision]);

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
