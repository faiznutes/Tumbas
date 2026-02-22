"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ReceiptVerificationResult } from "@/lib/api";
import { formatDateTimeId, formatPriceIdr, getOrderProgressLabel } from "@/lib/order-presenter";

const reasonLabel: Record<string, string> = {
  invalid_receipt_format: "Format nomor bukti tidak valid",
  receipt_not_found: "Nomor bukti tidak ditemukan",
  verification_code_mismatch: "Kode verifikasi tidak cocok",
  invalid_resi_format: "Format resi tidak valid",
  resi_not_found: "Resi tidak ditemukan",
  not_shipped_to_expedition: "Order belum dikonfirmasi dikirim ke ekspedisi",
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: "Menunggu pembayaran",
  PAID: "Pembayaran diterima",
  FAILED: "Pembayaran gagal",
  EXPIRED: "Pembayaran kedaluwarsa",
  CANCELLED: "Pesanan dibatalkan",
};

export default function VerifyReceiptPage() {
  const [resi, setResi] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptVerificationResult | null>(null);
  const [error, setError] = useState("");

  const normalizeResi = (value: string) =>
    value
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9-]/g, "");

  const normalizedPreview = (() => {
    return normalizeResi(resi);
  })();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    try {
      setLoading(true);
      const data = await api.orders.verifyResi(normalizedPreview || resi);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memverifikasi receipt";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const order = result?.order;
  const isValidOrder = Boolean(result?.valid && order);
  const orderItems = order?.items && order.items.length > 0
    ? order.items
    : order
      ? [{ id: `${order.id}-fallback`, title: order.productTitle, quantity: 1 }]
      : [];
  const totalItems = order?.totalItems || orderItems.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);

  const steps = (() => {
    if (!order) return [] as Array<{ label: string; detail: string }>;

    const shippedLabel = order.shippedAt
      ? `Dikirim ${formatDateTimeId(order.shippedAt)}`
      : "Menunggu konfirmasi ekspedisi";

    return [
      { label: "Order Dibuat", detail: formatDateTimeId(order.createdAt) },
      { label: "Pembayaran", detail: paymentStatusLabel[order.paymentStatus] || `Status: ${order.paymentStatus}` },
      { label: "Diproses Gudang", detail: order.paymentStatus === "PAID" ? "Pesanan sedang diproses" : "Menunggu pembayaran" },
      { label: "Dikirim ke Ekspedisi", detail: shippedLabel },
      { label: "Selesai", detail: "Menunggu konfirmasi diterima" },
    ];
  })();

  const activeStepIndex = (() => {
    if (!order) return -1;
    if (["FAILED", "EXPIRED", "CANCELLED"].includes(order.paymentStatus)) return 1;
    if (order.paymentStatus !== "PAID") return 1;
    if (!order.shippedToExpedition || !order.expeditionResi) return 2;
    return 3;
  })();

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-[#0d141b]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#137fec]">verified_user</span>
            <h1 className="text-lg font-bold">Verifikasi Resi</h1>
          </div>
          <Link href="/" className="inline-flex items-center gap-1 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f65bd]">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-2 text-xl font-black">Lacak Status Pesananmu</h2>
          <p className="mb-4 text-sm text-[#4c739a]">Masukkan resi Tumbas, order code, atau resi ekspedisi untuk melihat progres pesanan.</p>
          <form onSubmit={handleVerify} className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-medium">Nomor Resi / Order Code</label>
              <input
                value={resi}
                onChange={(e) => setResi(normalizeResi(e.target.value))}
                placeholder="Contoh: TMB-1771689505558-T9EH4Z / TMB-RESI-... / RCPT-TMB-..."
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                required
              />
              {normalizedPreview && <p className="mt-1 text-xs text-[#4c739a]">Input terformat: {normalizedPreview}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#137fec] px-6 font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Verifikasi Sekarang"}
            </button>
          </form>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {result && !isValidOrder && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Resi tidak valid: {reasonLabel[result.reason || ""] || "Data tidak cocok"}
          </div>
        )}

        {isValidOrder && order && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-black">Ringkasan Verifikasi Pesanan</h2>
              <p className="mt-1 text-sm text-[#4c739a]">
                {order.orderCode} • Dibuat {formatDateTimeId(order.createdAt)}
              </p>
            </div>

            {!order.shippedToExpedition && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Data order ditemukan. Saat ini pesanan belum diserahkan ke ekspedisi.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
                    <span className="material-symbols-outlined text-[#137fec]">analytics</span>
                    Status Pesanan
                  </h3>
                  <div className="space-y-0">
                    {steps.map((step, index) => {
                      const completed = index < activeStepIndex;
                      const active = index === activeStepIndex;
                      const pending = index > activeStepIndex;
                      return (
                        <div key={step.label} className="relative flex gap-4 pb-7 last:pb-0">
                          {index < steps.length - 1 && (
                            <div className={`absolute left-[11px] top-6 h-full w-0.5 ${completed || active ? "bg-[#137fec]/30" : "bg-slate-200"}`} />
                          )}
                          <div
                            className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                              completed
                                ? "bg-[#137fec] text-white"
                                : active
                                  ? "border-2 border-[#137fec] bg-white text-[#137fec]"
                                  : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {completed ? <span className="material-symbols-outlined text-[14px]">check</span> : <div className="h-2 w-2 rounded-full bg-current" />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${active ? "text-[#137fec]" : pending ? "text-slate-400" : "text-[#0d141b]"}`}>{step.label}</p>
                            <p className={`text-xs ${pending ? "text-slate-400" : "text-[#4c739a]"}`}>{step.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                    <span className="material-symbols-outlined text-[#137fec]">inventory_2</span>
                    Informasi Pengiriman
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Resi Terkonfirmasi</p>
                      <p className="font-semibold">{order.shippingResi || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ekspedisi</p>
                      <p className="font-semibold">{order.expeditionName || "Belum ditentukan"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status Progress</p>
                      <p className="font-semibold">{getOrderProgressLabel(order)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <span className="material-symbols-outlined text-[#137fec]">shopping_bag</span>
                      Detail Pembelian
                    </h3>
                    <span className="rounded-full bg-[#137fec]/10 px-3 py-1 text-xs font-bold text-[#137fec]">Total Item: {totalItems} pcs</span>
                  </div>

                  <div className="flex-1 p-6">
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold">{item.title}</p>
                            <p className="text-sm font-semibold text-[#137fec]">x{Math.max(1, Number(item.quantity || 1))} pcs</p>
                          </div>
                          {item.variantLabel && <p className="mt-1 text-xs text-[#4c739a]">Varian: {item.variantLabel}</p>}
                        </div>
                      ))}
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-sm text-[#4c739a]">Receipt: {order.receiptNo}</p>
                        <p className="text-sm text-[#4c739a]">Kode Verifikasi: {order.verificationCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#4c739a]">Status Pembayaran</span>
                        <span className="font-semibold">{paymentStatusLabel[order.paymentStatus] || order.paymentStatus}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#4c739a]">Dibuat</span>
                        <span className="font-semibold">{formatDateTimeId(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-slate-200 pt-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Order Code</p>
                        <p className="text-sm font-semibold">{order.orderCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total</p>
                        <p className="text-2xl font-black text-[#137fec]">{formatPriceIdr(order.amount)}</p>
                      </div>
                    </div>

                    {order.paymentStatus === "PENDING" && order.publicToken && (
                      <Link
                        href={`/payment/pending?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.publicToken)}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#137fec] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f65bd]"
                      >
                        Lanjutkan Pembayaran
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
