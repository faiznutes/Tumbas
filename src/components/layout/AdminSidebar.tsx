"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/api";
import { ADMIN_SESSION_UPDATED_EVENT, getCurrentAdminUser, hasAdminPermission, hasAnyAdminPermission, setCurrentAdminUser } from "@/lib/admin-permissions";

const navItems = [
  { href: "/admin/dashboard", label: "Dasbor", icon: "dashboard" },
  { href: "/admin/products", label: "Produk", icon: "inventory_2" },
  { href: "/admin/categories", label: "Kategori", icon: "category" },
  { href: "/admin/discounts", label: "Diskon", icon: "local_offer" },
  { href: "/admin/orders", label: "Pesanan", icon: "shopping_cart" },
  { href: "/admin/orders/report", label: "Laporan Pesanan", icon: "assessment" },
  { href: "/admin/messages", label: "Pesan", icon: "mail" },
  { href: "/admin/customers", label: "Pelanggan", icon: "group" },
  { href: "/admin/users", label: "Pengguna", icon: "admin_panel_settings" },
  { href: "/admin/webhooks", label: "Monitor Webhook", icon: "monitor_heart" },
  { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(() => getCurrentAdminUser());
  const role = sessionUser.role || "";

  useEffect(() => {
    const syncSession = () => setSessionUser(getCurrentAdminUser());
    syncSession();
    window.addEventListener(ADMIN_SESSION_UPDATED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(ADMIN_SESSION_UPDATED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.href === "/admin/users") return role === "SUPER_ADMIN";
      if (item.href === "/admin/webhooks") return role === "SUPER_ADMIN";
      if (item.href === "/admin/settings") {
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
      if (item.href === "/admin/messages") return hasAdminPermission("messages.view");
      if (item.href === "/admin/orders") return hasAdminPermission("orders.view");
      if (item.href === "/admin/orders/report") return hasAdminPermission("orders.view");
      if (item.href === "/admin/customers") return hasAdminPermission("orders.view");
      if (item.href === "/admin/products") return hasAdminPermission("products.edit");
      if (item.href === "/admin/categories") {
        return hasAnyAdminPermission(["products.categories.view", "products.categories.edit", "products.edit"]);
      }
      if (item.href === "/admin/discounts") return hasAdminPermission("products.edit");
      return true;
    });
  }, [role, sessionUser.permissions]);

  const currentTitle = useMemo(() => {
    const exact = navItems.find((item) => pathname === item.href);
    if (exact) return exact.label;

    const matched = navItems
      .filter((item) => item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];

    return matched?.label || 'Dasbor';
  }, [pathname]);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentAdminUser(null);
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white overflow-y-auto transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 p-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#137fec] text-white">
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-normal text-[#0d141b]">Panel Admin</h1>
              <p className="text-xs font-medium text-[#4c739a]">Manajemen Toko</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex flex-col gap-1 px-4 py-4">
          {visibleNavItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                  ? "bg-[#137fec]/10 text-[#137fec]" 
                  : "text-[#4c739a] hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="h-10 w-10 rounded-full bg-[#137fec] flex items-center justify-center font-bold text-white">A</div>
            <div className="flex flex-1 flex-col">
              <p className="text-sm font-bold text-[#0d141b]">Admin</p>
              <p className="text-xs text-[#4c739a]">{role || 'Admin'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-[#4c739a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#f6f7f8]">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 backdrop-blur">
          <div className="flex items-center gap-4">
            <button className="rounded-lg p-2 text-[#4c739a] hover:bg-slate-100 hover:text-[#137fec]" onClick={() => setSidebarOpen((prev) => !prev)} aria-label="Toggle menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-xl font-bold tracking-tight text-[#0d141b]">
              {currentTitle}
            </h2>
          </div>
          <div className="w-10" />
        </header>
        {children}
      </main>
    </div>
  );
}
