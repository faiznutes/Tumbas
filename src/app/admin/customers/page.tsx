"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type CustomerOrderPreview = {
  id: string;
  orderCode: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
};

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
  status: "ACTIVE" | "INACTIVE";
  recentOrders: CustomerOrderPreview[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const statusColors: Record<CustomerSummary["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
};

export default function AdminCustomers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "INACTIVE">("all");
  const [activeCustomer, setActiveCustomer] = useState<CustomerSummary | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const response = await api.orders.getAll({ limit: 300 });
        const orders = response.data || [];

        const map = new Map<string, CustomerSummary>();
        orders.forEach((order) => {
          const key = order.customerEmail?.toLowerCase() || order.id;
          const existing = map.get(key);
          if (!existing) {
              map.set(key, {
                id: key,
                name: order.customerName || "-",
                email: order.customerEmail || "-",
                phone: order.customerPhone || "-",
                orders: 1,
                totalSpent: order.amount || 0,
                lastOrderAt: order.createdAt,
                status: "ACTIVE",
                recentOrders: [
                  {
                    id: order.id,
                    orderCode: order.orderCode,
                    amount: order.amount || 0,
                    paymentStatus: order.paymentStatus,
                    createdAt: order.createdAt,
                  },
                ],
              });
              return;
            }

          existing.orders += 1;
          existing.totalSpent += order.amount || 0;
          if (new Date(order.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
            existing.lastOrderAt = order.createdAt;
          }

          existing.recentOrders.push({
            id: order.id,
            orderCode: order.orderCode,
            amount: order.amount || 0,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
          });
        });

        const now = Date.now();
        const rows = Array.from(map.values()).map((customer) => {
          const inactive = now - new Date(customer.lastOrderAt).getTime() > 1000 * 60 * 60 * 24 * 90;
          return {
            ...customer,
            status: (inactive ? "INACTIVE" : "ACTIVE") as CustomerSummary["status"],
            recentOrders: customer.recentOrders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5),
          };
        });

        rows.sort((a, b) => b.totalSpent - a.totalSpent);
        setCustomers(rows);
      } catch (error) {
        console.error("Failed to fetch customers from orders:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const keyword = searchQuery.toLowerCase();
      const matchesSearch =
        customer.name.toLowerCase().includes(keyword) ||
        customer.email.toLowerCase().includes(keyword) ||
        customer.phone.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  const exportCsv = () => {
    if (filteredCustomers.length === 0) {
      addToast("Tidak ada data pelanggan untuk diekspor", "warning");
      return;
    }

    const header = ["nama", "email", "telepon", "status", "jumlah_pesanan", "total_belanja", "pesanan_terakhir"];
    const rows = filteredCustomers.map((customer) => {
      const escaped = [
        customer.name,
        customer.email,
        customer.phone,
        customer.status,
        String(customer.orders),
        String(customer.totalSpent),
        customer.lastOrderAt,
      ].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`);
      return escaped.join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", `pelanggan-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    addToast("Export pelanggan berhasil", "success");
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Pelanggan</h1>
          <p className="text-[#4c739a]">Data pelanggan dibangun dari riwayat pesanan nyata.</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f65bd]"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-2xl font-bold text-[#0d141b]">{customers.length}</p>
          <p className="text-sm text-[#4c739a]">Total Pelanggan</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-2xl font-bold text-[#0d141b]">{customers.filter((c) => c.status === "ACTIVE").length}</p>
          <p className="text-sm text-[#4c739a]">Pelanggan Aktif</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-2xl font-bold text-[#0d141b]">{customers.reduce((sum, c) => sum + c.orders, 0)}</p>
          <p className="text-sm text-[#4c739a]">Total Pesanan</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="truncate text-2xl font-bold text-[#0d141b]">{formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
          <p className="text-sm text-[#4c739a]">Total Nilai Pesanan</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Cari pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "ACTIVE" | "INACTIVE")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
          >
            <option value="all">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat data pelanggan...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Belum ada data pelanggan dari pesanan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs uppercase text-[#4c739a]">
                <tr>
                  <th className="px-6 py-4 text-left">Pelanggan</th>
                  <th className="px-6 py-4 text-left">Telepon</th>
                  <th className="px-6 py-4 text-left">Pesanan</th>
                  <th className="px-6 py-4 text-left">Total Belanja</th>
                  <th className="px-6 py-4 text-left">Pesanan Terakhir</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0d141b]">{customer.name}</p>
                      <p className="text-xs text-[#4c739a]">{customer.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#0d141b]">{customer.phone}</td>
                    <td className="px-6 py-4 text-[#0d141b]">{customer.orders}</td>
                    <td className="px-6 py-4 font-medium text-[#0d141b]">{formatPrice(customer.totalSpent)}</td>
                    <td className="px-6 py-4 text-[#4c739a]">{new Date(customer.lastOrderAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[customer.status]}`}>
                        {customer.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setActiveCustomer(customer)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-[#0d141b] hover:bg-slate-200"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0d141b]">Detail Pelanggan</h2>
              <button onClick={() => setActiveCustomer(null)} className="text-[#4c739a] hover:text-[#0d141b]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#4c739a]">Nama</p>
                <p className="font-medium text-[#0d141b]">{activeCustomer.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#4c739a]">Email</p>
                <p className="font-medium text-[#0d141b]">{activeCustomer.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#4c739a]">Telepon</p>
                <p className="font-medium text-[#0d141b]">{activeCustomer.phone}</p>
              </div>
              <div>
                <p className="text-xs text-[#4c739a]">Status</p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[activeCustomer.status]}`}>
                  {activeCustomer.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                </span>
              </div>
              <div>
                <p className="text-xs text-[#4c739a]">Jumlah Pesanan</p>
                <p className="font-medium text-[#0d141b]">{activeCustomer.orders}</p>
              </div>
              <div>
                <p className="text-xs text-[#4c739a]">Total Belanja</p>
                <p className="font-medium text-[#0d141b]">{formatPrice(activeCustomer.totalSpent)}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#0d141b]">5 Pesanan Terbaru</h3>
              {activeCustomer.recentOrders.length === 0 ? (
                <p className="text-sm text-[#4c739a]">Belum ada pesanan tercatat.</p>
              ) : (
                <div className="space-y-2">
                  {activeCustomer.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-[#0d141b]">{order.orderCode}</p>
                        <p className="text-xs text-[#4c739a]">
                          {new Date(order.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#0d141b]">{formatPrice(order.amount)}</p>
                        <p className="text-xs text-[#4c739a]">{order.paymentStatus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
