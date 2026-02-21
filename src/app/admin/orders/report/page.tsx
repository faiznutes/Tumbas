"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface OrderRow {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentStatus: string;
  shippedToExpedition?: boolean;
  createdAt: string;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function toCsvCell(value: string | number | boolean) {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, '""')}"`;
}

export default function OrdersReportPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.orders.getAll({ limit: 500 });
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch order report:", error);
      addToast("Gagal memuat laporan pesanan", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const passFrom = !from || createdAt >= from;
      const passTo = !to || createdAt <= to;
      const passStatus = status === "all" || order.paymentStatus === status;
      return passFrom && passTo && passStatus;
    });
  }, [orders, fromDate, toDate, status]);

  const stats = useMemo(() => {
    const totalOrders = filtered.length;
    const paidOrders = filtered.filter((order) => order.paymentStatus === "PAID").length;
    const pendingOrders = filtered.filter((order) => order.paymentStatus === "PENDING").length;
    const shippedOrders = filtered.filter((order) => order.shippedToExpedition).length;
    const totalRevenue = filtered
      .filter((order) => order.paymentStatus === "PAID")
      .reduce((sum, order) => sum + order.amount, 0);
    return { totalOrders, paidOrders, pendingOrders, shippedOrders, totalRevenue };
  }, [filtered]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      addToast("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const header = [
      "order_code",
      "created_at",
      "customer_name",
      "customer_email",
      "amount",
      "payment_status",
      "shipped_to_expedition",
    ];

    const rows = filtered.map((order) => [
      toCsvCell(order.orderCode),
      toCsvCell(new Date(order.createdAt).toISOString()),
      toCsvCell(order.customerName),
      toCsvCell(order.customerEmail),
      toCsvCell(order.amount),
      toCsvCell(order.paymentStatus),
      toCsvCell(Boolean(order.shippedToExpedition)),
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", `laporan-pesanan-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    addToast("Laporan CSV berhasil diunduh", "success");
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Laporan Pesanan</h1>
          <p className="text-[#4c739a]">Ringkasan transaksi berdasarkan rentang tanggal dan status</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d141b] hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Kembali ke Pesanan
          </Link>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f65bd]"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Total Order</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{stats.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Order Lunas</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{stats.paidOrders}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Menunggu</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{stats.pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Sudah Dikirim</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{stats.shippedOrders}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Total Omzet</p>
          <p className="mt-1 text-lg font-bold text-[#0d141b]">{formatPrice(stats.totalRevenue)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#e7edf3] bg-white p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0d141b]">Tanggal Mulai</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0d141b]">Tanggal Akhir</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0d141b]">Status Pembayaran</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b]"
            >
              <option value="all">Semua</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e7edf3] bg-white">
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat data laporan...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Tidak ada data pesanan pada filter ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Kode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Pengiriman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7edf3]">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-[#0d141b]">{order.orderCode}</td>
                    <td className="px-6 py-4 text-sm text-[#4c739a]">
                      {new Date(order.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#0d141b]">{order.customerName}</p>
                      <p className="text-xs text-[#4c739a]">{order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0d141b]">{formatPrice(order.amount)}</td>
                    <td className="px-6 py-4 text-sm text-[#0d141b]">{order.paymentStatus}</td>
                    <td className="px-6 py-4">
                      {order.shippedToExpedition ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Sudah</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Belum</span>
                      )}
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
