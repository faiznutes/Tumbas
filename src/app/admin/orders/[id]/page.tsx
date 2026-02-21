"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, Order } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
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

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingShipping, setSavingShipping] = useState(false);
  const [expeditionName, setExpeditionName] = useState("");
  const [expeditionResi, setExpeditionResi] = useState("");
  const { addToast } = useToast();

  const normalizeResiInput = (value: string) =>
    value
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9-]/g, "");

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const data = await api.orders.getById(orderId);
      setOrder(data);
      setExpeditionName(data.expeditionName || "");
      setExpeditionResi(data.expeditionResi || "");
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail pesanan");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmShipping = async () => {
    if (!order) return;

    const normalizedResi = normalizeResiInput(expeditionResi);
    if (!normalizedResi) {
      addToast("Resi ekspedisi wajib diisi", "warning");
      return;
    }

    try {
      setSavingShipping(true);
      await api.orders.confirmShipping(order.id, {
        expeditionResi: normalizedResi,
        expeditionName: expeditionName.trim() || undefined,
      });
      addToast("Konfirmasi pengiriman ke ekspedisi berhasil", "success");
      await fetchOrder();
    } catch (err: any) {
      addToast(err?.message || "Gagal menyimpan data pengiriman", "error");
    } finally {
      setSavingShipping(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-8 text-[#4c739a]">Memuat detail pesanan...</div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <p className="mb-4 text-red-600">{error || "Pesanan tidak ditemukan"}</p>
        <Link href="/admin/orders" className="text-[#137fec] hover:underline">
          Kembali ke daftar pesanan
        </Link>
      </div>
    );
  }

  const orderItems = order.orderItems && order.orderItems.length > 0
    ? order.orderItems
    : [{
      id: `${order.id}-fallback`,
      productId: order.productId,
      productTitleSnapshot: order.product.title,
      unitPrice: order.product.price,
      quantity: 1,
      selectedVariantLabel: order.selectedVariantLabel,
      itemWeightGram: order.itemWeightGram || order.product.weightGram || 1000,
    }];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#4c739a] transition-colors hover:bg-slate-200"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0d141b]">Detail Pesanan</h1>
            <p className="text-[#4c739a]">{order.orderCode}</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-medium ${statusColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
          {statusLabels[order.paymentStatus] || order.paymentStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Produk</h2>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#0d141b]">{item.productTitleSnapshot}</h3>
                      {item.selectedVariantLabel && (
                        <p className="text-xs text-[#4c739a]">Varian: {item.selectedVariantLabel}</p>
                      )}
                      <p className="text-xs text-[#4c739a]">Qty: {item.quantity} • Berat: {item.itemWeightGram}g</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#4c739a]">{formatPrice(item.unitPrice)} / item</p>
                      <p className="font-semibold text-[#0d141b]">{formatPrice(item.unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Informasi Pembeli</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm text-[#4c739a]">Nama</p>
                <p className="font-medium text-[#0d141b]">{order.customerName}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-[#4c739a]">Email</p>
                <p className="font-medium text-[#0d141b]">{order.customerEmail}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-[#4c739a]">Telepon</p>
                <p className="font-medium text-[#0d141b]">{order.customerPhone}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-[#4c739a]">Alamat</p>
                <p className="font-medium text-[#0d141b]">
                  {order.customerAddress}, {order.customerCity} {order.customerPostalCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Pembayaran</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Total</span>
                <span className="font-semibold text-[#0d141b]">{formatPrice(order.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Status</span>
                <span className="text-[#0d141b]">{statusLabels[order.paymentStatus] || order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Dibuat</span>
                <span className="text-[#0d141b]">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Dibayar</span>
                <span className="text-[#0d141b]">{formatDate(order.paidAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Pengiriman ke Ekspedisi</h2>

            {order.shippedToExpedition ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Order sudah dikonfirmasi ke ekspedisi.
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Setelah admin konfirmasi, user akan melihat bahwa order sudah diserahkan ke ekspedisi beserta resi ekspedisi.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4c739a]">Nama Ekspedisi (opsional)</label>
                <input
                  value={expeditionName}
                  onChange={(e) => setExpeditionName(e.target.value)}
                  placeholder="contoh: JNE"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#4c739a]">Resi Ekspedisi</label>
                <input
                  value={expeditionResi}
                  onChange={(e) => setExpeditionResi(normalizeResiInput(e.target.value))}
                  placeholder="contoh: JNE0123456789"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
                />
                <p className="mt-1 text-xs text-[#4c739a]">Format bebas teks. Otomatis uppercase dan tanpa spasi.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-[#4c739a]">Status</span>
                  <span className="font-medium text-[#0d141b]">
                    {order.shippedToExpedition ? "Sudah ke ekspedisi" : "Belum dikonfirmasi"}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#4c739a]">Resi Tumbas</span>
                  <span className="font-medium text-[#0d141b]">{`TMB-RESI-${order.orderCode.replace(/[^A-Z0-9]/gi, "").slice(0, 12).toUpperCase()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4c739a]">Waktu Konfirmasi</span>
                  <span className="font-medium text-[#0d141b]">{formatDate(order.shippedAt || null)}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmShipping}
                disabled={savingShipping || order.paymentStatus !== "PAID"}
                className="w-full rounded-lg bg-[#137fec] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-50"
              >
                {savingShipping ? "Menyimpan..." : "Konfirmasi Kirim ke Ekspedisi"}
              </button>
              {order.paymentStatus !== "PAID" && (
                <p className="text-xs text-red-600">Order harus berstatus PAID sebelum bisa dikonfirmasi ke ekspedisi.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-[#4c739a]">
            Status pembayaran tidak dapat diubah manual. Pembaruan status dilakukan otomatis melalui webhook Midtrans.
          </div>
        </div>
      </div>
    </div>
  );
}
