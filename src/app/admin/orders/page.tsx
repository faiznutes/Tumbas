"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  PAID: "Lunas",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

async function fetchOrders() {
    try {
      const data = await api.orders.getAll({ limit: 100 });
      setOrders(data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Pesanan</h1>
          <p className="text-[#4c739a]">Kelola semua pesanan masuk</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e7edf3] p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#4c739a]">search</span>
              <input
                type="text"
                placeholder="Cari pesanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
          >
            <option value="all">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="PAID">Lunas</option>
            <option value="SHIPPED">Dikirim</option>
            <option value="DELIVERED">Selesai</option>
            <option value="FAILED">Gagal</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e7edf3]">
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Tidak ada pesanan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Kode Pesanan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7edf3]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-[#0d141b]">{order.orderCode}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#0d141b]">{order.customerName}</p>
                        <p className="text-xs text-[#4c739a]">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#0d141b]">{formatPrice(order.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.paymentStatus] || 'bg-gray-100'}`}>
                        {statusLabels[order.paymentStatus] || order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4c739a]">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-[#137fec] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0d141b]">Detail Pesanan</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-[#4c739a] hover:text-[#0d141b]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#4c739a]">Kode Pesanan</p>
                  <p className="font-medium text-[#0d141b]">{selectedOrder.orderCode}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4c739a]">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.paymentStatus]}`}>
                    {statusLabels[selectedOrder.paymentStatus]}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#4c739a]">Pelanggan</p>
                <p className="font-medium text-[#0d141b]">{selectedOrder.customerName}</p>
                <p className="text-sm text-[#4c739a]">{selectedOrder.customerEmail}</p>
                <p className="text-sm text-[#4c739a]">{selectedOrder.customerPhone}</p>
              </div>

              <div>
                <p className="text-xs text-[#4c739a]">Alamat Pengiriman</p>
                <p className="text-sm text-[#0d141b]">{selectedOrder.customerAddress}</p>
                <p className="text-sm text-[#4c739a]">{selectedOrder.customerCity}, {selectedOrder.customerPostalCode}</p>
              </div>

              <div>
                <p className="text-xs text-[#4c739a]">Total Pembayaran</p>
                <p className="text-xl font-bold text-[#137fec]">{formatPrice(selectedOrder.amount)}</p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-[#4c739a]">
                Status pembayaran tidak dapat diubah manual dari panel admin. Status diperbarui otomatis melalui webhook Midtrans.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
