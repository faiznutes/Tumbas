"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/api";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Produk", icon: "inventory_2" },
  { href: "/admin/orders", label: "Pesanan", icon: "shopping_cart" },
  { href: "/admin/messages", label: "Pesan", icon: "mail" },
  { href: "/admin/customers", label: "Pelanggan", icon: "group" },
  { href: "/admin/users", label: "Pengguna", icon: "admin_panel_settings" },
  { href: "/admin/webhooks", label: "Webhook Monitor", icon: "monitor_heart" },
  { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw) as { role?: string };
      return parsed.role || '';
    } catch {
      return '';
    }
  }, []);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.href === '/admin/users') {
        return role === 'SUPER_ADMIN';
      }
      if (item.href === '/admin/settings') {
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER';
      }
      if (item.href === '/admin/messages') {
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER';
      }
      if (item.href === '/admin/webhooks') {
        return role === 'SUPER_ADMIN' || role === 'ADMIN';
      }
      return true;
    });
  }, [role]);

  const handleLogout = () => {
    setAuthToken(null);
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white overflow-y-auto transition-transform md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 p-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#137fec] text-white">
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-normal text-[#0d141b]">Admin Panel</h1>
              <p className="text-xs font-medium text-[#4c739a]">E-commerce Manager</p>
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
        <button className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#f6f7f8]">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur">
          <div className="flex items-center gap-4">
            <button className="rounded-lg p-2 text-[#4c739a] hover:bg-slate-100 hover:text-[#137fec]" onClick={() => setSidebarOpen((prev) => !prev)} aria-label="Toggle menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-xl font-bold tracking-tight text-[#0d141b]">
              {navItems.find(item => pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="w-10" />
        </header>
        {children}
      </main>
    </div>
  );
}
