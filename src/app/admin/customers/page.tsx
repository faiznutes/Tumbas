"use client";

import { useState } from "react";

const customers = [
  { id: "1", name: "Budi Santoso", email: "budi@email.com", phone: "081234567890", orders: 5, totalSpent: 125000000, joinDate: "15 Jan 2024", status: "ACTIVE", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_VGd6L6FF0Xuz7WpzTyWa8-E8qAlICgQFnb4kd3DPCbrqr-MJAc7PKZEDyvL29iELitPrQLmVZ9TNLdEiBfzUs7t9pB4s0rtfKPiXj_ZVqMxOB1xwWi0FnaOQ7EXpcAR2WUs_rkJzq_oG3-2r-GjwBLSj9Lb9-wkP2M0-m84dM3I8PleCPUPU7lnclYeYC9Dq_GfrmH6MLgsmiPnxToIFNnjoudIfpPLB4ty06AP-wdzqp0BT0fNk7fOdyPlVkK0Q6VqqhmU-660" },
  { id: "2", name: "Siti Aminah", email: "siti@email.com", phone: "081234567891", orders: 12, totalSpent: 89500000, joinDate: "20 Feb 2024", status: "ACTIVE", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFzb82E1XHdYOCzjige-ccvDm2q_Tm8MzfQsUfZHQ5UzMheemYBBg0koCUJ35huLizytx9QxGrQrFzflSkbasVj7-01-N4qzOTY_Qg-oX4v0n0seLkEv58xCFPfSvGuvo0YsXumvzVtPZ4yI2U6EOuSkO1YuXlPC5fwpy7VTvqW1YzY2gQgxwGrVesdcUQ39ssChCQtqDZ6BmpnjvMwxi7ViyNqwTz6gdHPG1IO2ueuXdmm5Nv9iPbfBW5e9syy3N2kCdgg-N4sGI" },
  { id: "3", name: "Ahmad Wijaya", email: "ahmad@email.com", phone: "081234567892", orders: 3, totalSpent: 45000000, joinDate: "5 Mar 2024", status: "ACTIVE", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzVFZdO2bsjn2KComklWwKGW00xXsnx4F0mFUI2s8s2nppo1GIKluZkSX3TiYPVQG5rYts5mYww9dJkEK_Gs2sHWJPV5avYDon75kQLfk5vzt1TvQ2k4gWNMuO1msEj4fBeDqj9jwXdC9jr3SPnJ1wCMEYX3uvchJI7aW2Y2ZL97tkNR9LYVtwSWod-blmTzbIrueGDCMy9C9mJl8mTukBDK5oFFsQ6nxS2FfQiF8QidAMABYKr4oISL9_F3e8h2s4cM7MK7Vmck0" },
  { id: "4", name: "Dewi Lestari", email: "dewi@email.com", phone: "081234567893", orders: 8, totalSpent: 120000000, joinDate: "12 Apr 2024", status: "ACTIVE", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIkYBf9xQQCBj0kGud3P9k_vsUMv1ZJyD-Tj7KGVrzACgPQoqBwo8MofA3h-PIiuGbR_axJuucHmPio_CC86XPk7oSxocIv8tF41ioAF7FF6bzb4kGBnasiWN5Wxpe2xGWHDff_wCiwY5GMweWSkwFwy-EdZBuXflQAEIA3UKx9Z-AJjYMfcpCKZPA_oLoa60q3MLGFIn4_TnUjSJJrGZV-CUZhCbRF6tElhjZpmIkXy_YbhWslU0NmOmHdMEGukqTDSPSxIQEmb8" },
  { id: "5", name: "Rudi Hermawan", email: "rudi@email.com", phone: "081234567894", orders: 1, totalSpent: 4999000, joinDate: "1 May 2024", status: "INACTIVE", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXE3yE1EKBJTzPRtPENfXrC9bW3a_rMJzA8zEotLXMRJvvVRhksHN0RuJSY3jqQ2a3qLs-d3bjajIbrubi4ryhzINoem60VOVe-Jeukg2T3EltGppI7Ea10IJoeLBg797DVVd-VKowj9T8jDatM7jh9CSElhE48EomHHh9Q9i7GnTRhZb5RP7PwoMbFvOmgYd2S50Vq-wQ-mdvibWqyESRKHWR6s3QG2S4tVhBTHLXpKBD9vK2AyG_Crt_ifNj70iDOLtmRFee9Do" },
  { id: "6", name: "Lisa Permata", email: "lisa@email.com", phone: "081234567895", orders: 15, totalSpent: 250000000, joinDate: "10 Jun 2024", status: "ACTIVE", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_VGd6L6FF0Xuz7WpzTyWa8-E8qAlICgQFnb4kd3DPCbrqr-MJAc7PKZEDyvL29iELitPrQLmVZ9TNLdEiBfzUs7t9pB4s0rtfKPiXj_ZVqMxOB1xwWi0FnaOQ7EXpcAR2WUs_rkJzq_oG3-2r-GjwBLSj9Lb9-wkP2M0-m84dM3I8PleCPUPU7lnclYeYC9Dq_GfrmH6MLgsmiPnxToIFNnjoudIfpPLB4ty06AP-wdzqp0BT0fNk7fOdyPlVkK0Q6VqqhmU-660" },
];

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Pelanggan</h1>
          <p className="text-[#4c739a]">Kelola semua pelanggan di toko Anda</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d141b]">{customers.length}</p>
              <p className="text-sm text-[#4c739a]">Total Pelanggan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d141b]">{customers.filter(c => c.status === "ACTIVE").length}</p>
              <p className="text-sm text-[#4c739a]">Pelanggan Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d141b]">{customers.reduce((sum, c) => sum + c.orders, 0)}</p>
              <p className="text-sm text-[#4c739a]">Total Pesanan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d141b]">{formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
              <p className="text-sm text-[#4c739a]">Total Pendapatan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c739a]">search</span>
              <input
                type="text"
                placeholder="Cari pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
          >
            <option value="all">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#4c739a]">
            <thead className="bg-slate-50 text-xs uppercase text-[#4c739a]">
              <tr>
                <th className="px-6 py-4 font-semibold">Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Telepon</th>
                <th className="px-6 py-4 font-semibold">Pesanan</th>
                <th className="px-6 py-4 font-semibold">Total Belanja</th>
                <th className="px-6 py-4 font-semibold">Bergabung</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url('${customer.avatar}')` }}></div>
                      <div>
                        <p className="font-medium text-[#0d141b]">{customer.name}</p>
                        <p className="text-xs text-[#4c739a]">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#0d141b]">{customer.phone}</td>
                  <td className="px-6 py-4 text-[#0d141b]">{customer.orders}</td>
                  <td className="px-6 py-4 font-medium text-[#0d141b]">{formatPrice(customer.totalSpent)}</td>
                  <td className="px-6 py-4">{customer.joinDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
                      {customer.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#4c739a] hover:text-[#0d141b]">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
