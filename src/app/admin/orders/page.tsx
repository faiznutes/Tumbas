"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { hasAdminPermission } from "@/lib/admin-permissions";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
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
  shippedToExpedition?: boolean;
  shippedAt?: string | null;
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shippingTargetIds, setShippingTargetIds] = useState<string[]>([]);
  const [expeditionResiInput, setExpeditionResiInput] = useState("");
  const [expeditionNameInput, setExpeditionNameInput] = useState("");
  const [confirmingShipping, setConfirmingShipping] = useState(false);
  const { addToast } = useToast();
  const canEditOrders = hasAdminPermission("orders.edit");

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.orders.getAll({ limit: 200 });
      setOrders(data.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      addToast("Gagal memuat daftar pesanan", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.orderCode.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerEmail?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
      const matchesShipping =
        shippingFilter === "all" ||
        (shippingFilter === "shipped" && order.shippedToExpedition) ||
        (shippingFilter === "not_shipped" && !order.shippedToExpedition);

      return matchesSearch && matchesStatus && matchesShipping;
    });
  }, [orders, searchQuery, statusFilter, shippingFilter]);

  const metrics = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "PAID").length;
    const pending = orders.filter((o) => o.paymentStatus === "PENDING").length;
    const shipped = orders.filter((o) => o.shippedToExpedition).length;
    const omzet = orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.amount, 0);
    return { paid, pending, shipped, omzet };
  }, [orders]);

  const allFilteredSelected = filteredOrders.length > 0 && filteredOrders.every((order) => selectedIds.includes(order.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredOrders.some((order) => order.id === id)));
      return;
    }
    const next = new Set(selectedIds);
    filteredOrders.forEach((order) => next.add(order.id));
    setSelectedIds(Array.from(next));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const copySelectedOrderCodes = async () => {
    const selected = orders.filter((order) => selectedIds.includes(order.id));
    if (selected.length === 0) {
      addToast("Pilih minimal satu pesanan", "warning");
      return;
    }
    const text = selected.map((order) => order.orderCode).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      addToast(`Berhasil menyalin ${selected.length} kode pesanan`, "success");
    } catch {
      addToast("Gagal menyalin kode pesanan", "error");
    }
  };

  const openShippingModal = (ids: string[]) => {
    if (!canEditOrders) {
      addToast("Anda tidak memiliki izin untuk mengubah pesanan", "warning");
      return;
    }

    const eligible = orders.filter(
      (order) => ids.includes(order.id) && order.paymentStatus === "PAID" && !order.shippedToExpedition,
    );

    if (eligible.length === 0) {
      addToast("Pilih order yang sudah lunas dan belum dikirim ke ekspedisi", "warning");
      return;
    }

    setShippingTargetIds(eligible.map((order) => order.id));
    setExpeditionResiInput("");
    setExpeditionNameInput("");
  };

  const closeShippingModal = () => {
    if (confirmingShipping) return;
    setShippingTargetIds([]);
    setExpeditionResiInput("");
    setExpeditionNameInput("");
  };

  const confirmShipping = async () => {
    const trimmedResi = expeditionResiInput.trim();
    const trimmedExpedition = expeditionNameInput.trim();

    if (!trimmedResi) {
      addToast("Nomor resi/prefix resi wajib diisi", "warning");
      return;
    }

    if (shippingTargetIds.length === 0) {
      addToast("Tidak ada order yang dipilih", "warning");
      return;
    }

    setConfirmingShipping(true);
    try {
      if (shippingTargetIds.length === 1) {
        await api.orders.confirmShipping(shippingTargetIds[0], {
          expeditionResi: trimmedResi,
          expeditionName: trimmedExpedition || undefined,
        });
        addToast("Order berhasil dikonfirmasi ke ekspedisi", "success");
      } else {
        const result = await api.orders.bulkConfirmShipping({
          orderIds: shippingTargetIds,
          expeditionResi: trimmedResi,
          expeditionName: trimmedExpedition || undefined,
        });
        const successCount = result.successCount;
        const failedCount = result.failedCount;
        if (successCount > 0) {
          addToast(
            failedCount > 0
              ? `${successCount} order berhasil, ${failedCount} order gagal konfirmasi`
              : `${successCount} order berhasil dikonfirmasi ke ekspedisi`,
            failedCount > 0 ? "warning" : "success",
          );
        } else {
          addToast("Semua order gagal dikonfirmasi", "error");
        }
      }

      closeShippingModal();
      setSelectedIds([]);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error("Failed to confirm shipping:", error);
      addToast(error instanceof Error ? error.message : "Gagal konfirmasi pengiriman", "error");
    } finally {
      setConfirmingShipping(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Pesanan</h1>
          <p className="text-[#4c739a]">Pantau pembayaran, pengiriman, dan tindak lanjut order</p>
        </div>
        <div className="flex gap-2">
          {canEditOrders && (
            <button
              onClick={() => openShippingModal(selectedIds)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d141b] hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-base">local_shipping</span>
              Konfirmasi Ekspedisi ({selectedIds.length})
            </button>
          )}
          <button
            onClick={copySelectedOrderCodes}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d141b] hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
            Salin Kode ({selectedIds.length})
          </button>
          <Link
            href="/admin/orders/report"
            className="inline-flex items-center gap-2 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f65bd]"
          >
            <span className="material-symbols-outlined text-base">assessment</span>
            Laporan Pesanan
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Order Lunas</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{metrics.paid}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Menunggu Pembayaran</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{metrics.pending}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Sudah ke Ekspedisi</p>
          <p className="mt-1 text-2xl font-bold text-[#0d141b]">{metrics.shipped}</p>
        </div>
        <div className="rounded-xl border border-[#e7edf3] bg-white p-4">
          <p className="text-xs text-[#4c739a]">Omzet Terkonfirmasi</p>
          <p className="mt-1 text-xl font-bold text-[#0d141b]">{formatPrice(metrics.omzet)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#e7edf3] bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c739a]">search</span>
              <input
                type="text"
                placeholder="Cari kode, nama, email pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#e7edf3] py-2 pl-10 pr-4 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="PENDING">Menunggu</option>
            <option value="PAID">Lunas</option>
            <option value="FAILED">Gagal</option>
            <option value="EXPIRED">Kedaluwarsa</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <select
            value={shippingFilter}
            onChange={(e) => setShippingFilter(e.target.value)}
            className="rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
          >
            <option value="all">Semua Pengiriman</option>
            <option value="shipped">Sudah ke Ekspedisi</option>
            <option value="not_shipped">Belum ke Ekspedisi</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[#e7edf3] bg-white">
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Tidak ada pesanan dengan filter ini</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      disabled={!canEditOrders}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Kode Pesanan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Pembayaran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Pengiriman</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7edf3]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        disabled={!canEditOrders}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0d141b]">{order.orderCode}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#0d141b]">{order.customerName}</p>
                      <p className="text-xs text-[#4c739a]">{order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0d141b]">{formatPrice(order.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[order.paymentStatus] || order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.shippedToExpedition ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Sudah ke ekspedisi</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Belum dikonfirmasi</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4c739a]">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg p-2 text-[#137fec] transition-colors hover:bg-blue-50"
                          title="Lihat ringkasan"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {canEditOrders && order.paymentStatus === "PAID" && !order.shippedToExpedition && (
                          <button
                            onClick={() => openShippingModal([order.id])}
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Kirim
                          </button>
                        )}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded-lg bg-[#137fec] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f65bd]"
                        >
                          Kelola
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0d141b]">Ringkasan Pesanan</h2>
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
                  <p className="text-xs text-[#4c739a]">Status Bayar</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[selectedOrder.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                    {statusLabels[selectedOrder.paymentStatus] || selectedOrder.paymentStatus}
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
                <p className="text-sm text-[#4c739a]">
                  {selectedOrder.customerCity}, {selectedOrder.customerPostalCode}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#4c739a]">Total Pembayaran</p>
                <p className="text-xl font-bold text-[#137fec]">{formatPrice(selectedOrder.amount)}</p>
              </div>

              <Link
                href={`/admin/orders/${selectedOrder.id}`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#137fec] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f65bd]"
              >
                Buka Halaman Detail & Konfirmasi Pengiriman
              </Link>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-[#4c739a]">
                Status pembayaran tidak dapat diubah manual dari panel admin. Status diperbarui otomatis melalui webhook Midtrans.
              </div>
            </div>
          </div>
        </div>
      )}

      {shippingTargetIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0d141b]">Konfirmasi ke Ekspedisi</h2>
              <button onClick={closeShippingModal} className="text-[#4c739a] hover:text-[#0d141b]" disabled={confirmingShipping}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="mb-4 text-sm text-[#4c739a]">
              {shippingTargetIds.length === 1
                ? "Konfirmasi satu order ke ekspedisi dengan nomor resi asli."
                : `Konfirmasi ${shippingTargetIds.length} order sekaligus. Sistem akan membuat resi per order dengan format PREFIX-ORDERCODE.`}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0d141b]">Nama Ekspedisi (opsional)</label>
                <input
                  type="text"
                  value={expeditionNameInput}
                  onChange={(e) => setExpeditionNameInput(e.target.value)}
                  placeholder="Contoh: JNE"
                  className="w-full rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0d141b]">
                  {shippingTargetIds.length === 1 ? "Nomor Resi" : "Prefix Resi"}
                </label>
                <input
                  type="text"
                  value={expeditionResiInput}
                  onChange={(e) => setExpeditionResiInput(e.target.value)}
                  placeholder={shippingTargetIds.length === 1 ? "Contoh: JNE0123456789" : "Contoh: JNEBATCH-2202"}
                  className="w-full rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeShippingModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0d141b] hover:bg-slate-50"
                  disabled={confirmingShipping}
                >
                  Batal
                </button>
                <button
                  onClick={confirmShipping}
                  className="rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-60"
                  disabled={confirmingShipping}
                >
                  {confirmingShipping ? "Menyimpan..." : "Konfirmasi Pengiriman"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
