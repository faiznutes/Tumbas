"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const statusDots: Record<string, string> = {
  PENDING: "bg-yellow-500",
  SHIPPED: "bg-blue-500",
  DELIVERED: "bg-green-500",
  PAID: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-gray-500",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, activeProducts: 0, avgOrderValue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('forbidden') === '1') {
      addToast('Akses ke halaman tersebut dibatasi oleh role akun Anda.', 'warning');
      url.searchParams.delete('forbidden');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [addToast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersData, productsData] = await Promise.all([
          api.orders.getAll({ limit: 5 }),
          api.products.getAll({ limit: 100, status: 'AVAILABLE' }),
        ]);

        const orders = ordersData.data || [];
        const products = productsData.data || [];

        const totalRevenue = orders
          .filter((o: any) => o.paymentStatus === 'PAID')
          .reduce((sum: number, o: any) => sum + o.amount, 0);

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          activeProducts: products.length,
          avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = [45, 65, 50, 75, 60, 85, 70];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#4c739a]">Total Pendapatan</p>
            <h3 className="text-2xl font-bold text-[#0d141b]">{formatPrice(stats.totalRevenue)}</h3>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#4c739a]">Total Pesanan</p>
            <h3 className="text-2xl font-bold text-[#0d141b]">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#4c739a]">Produk Aktif</p>
            <h3 className="text-2xl font-bold text-[#0d141b]">{stats.activeProducts}</h3>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#4c739a]">Rata-rata Penjualan</p>
            <h3 className="text-2xl font-bold text-[#0d141b]">{formatPrice(stats.avgOrderValue)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Chart Section */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0d141b]">Pendapatan vs Pengeluaran</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-[#137fec]"></span>
              <span className="text-xs text-[#4c739a]">Pendapatan</span>
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="relative h-64 w-full">
            <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
              {chartData.map((height, index) => (
                <div key={index} className="w-full bg-slate-100 rounded-t-sm relative group h-full flex items-end">
                  <div 
                    className="w-full bg-[#137fec] hover:bg-[#137fec]/90 transition-all rounded-t-sm" 
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              ))}
            </div>
            {/* X-Axis Labels */}
            <div className="mt-4 flex justify-between px-2 text-xs font-medium text-[#4c739a]">
              {days.map((day, index) => (
                <span key={index}>{day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[#0d141b]">Aksi Cepat</h3>
            <div className="flex flex-col gap-3">
              <Link href="/admin/products/create" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#137fec] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Tambah Produk Baru
              </Link>
              <Link href="/admin/orders" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-[#0d141b] hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-[20px]">list_alt</span>
                Lihat Pesanan
              </Link>
              <Link href="/admin/settings" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-[#0d141b] hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Pengaturan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#0d141b]">Pesanan Terbaru</h3>
          <Link href="/admin/orders" className="text-sm font-medium text-[#137fec] hover:text-blue-600">Lihat Semua</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Belum ada pesanan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#4c739a]">
              <thead className="bg-slate-50 text-xs uppercase text-[#4c739a]">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID Pesanan</th>
                  <th className="px-6 py-4 font-semibold">Pelanggan</th>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Jumlah</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-[#0d141b]">{order.orderCode}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#137fec] flex items-center justify-center text-white font-bold">
                          {order.customerName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-[#0d141b]">{order.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#0d141b]">{formatPrice(order.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.paymentStatus] || 'bg-gray-100'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDots[order.paymentStatus] || 'bg-gray-500'}`}></span>
                        {order.paymentStatus === "PENDING" && "Menunggu"}
                        {order.paymentStatus === "PAID" && "Lunas"}
                        {order.paymentStatus === "FAILED" && "Gagal"}
                        {order.paymentStatus === "CANCELLED" && "Dibatalkan"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#4c739a] hover:text-[#0d141b]">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
