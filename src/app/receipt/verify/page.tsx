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

  return (
    <div className="min-h-screen bg-[#f6f7f8] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0d141b]">Verifikasi Resi</h1>
          <Link href="/" className="text-sm text-[#137fec] hover:underline">
            Kembali ke Beranda
          </Link>
        </div>

        <form onSubmit={handleVerify} className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-[#0d141b]">Resi Pengiriman</label>
            <input
              value={resi}
              onChange={(e) => setResi(normalizeResi(e.target.value))}
              placeholder="contoh: TMB-RESI-TMBABC123"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
              required
            />
            <p className="mt-2 text-xs text-[#4c739a]">Bisa input resi Tumbas atau resi ekspedisi. Sistem otomatis uppercase dan hapus spasi.</p>
            {normalizedPreview && (
              <p className="mt-1 text-xs text-[#0d141b]">
                Preview verifikasi: <span className="font-semibold">{normalizedPreview}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#137fec] px-5 py-3 text-white font-semibold hover:bg-[#0f65bd] disabled:opacity-50"
          >
            {loading ? "Memverifikasi..." : "Verifikasi"}
          </button>
        </form>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {result && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            {result.valid && result.order ? (
              <>
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  Resi valid dan terverifikasi.
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#4c739a]">Order ID</span><span className="font-medium text-[#0d141b]">{result.order.id}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Receipt No</span><span className="font-medium text-[#0d141b]">{result.order.receiptNo}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Resi Pengiriman</span><span className="font-medium text-[#0d141b]">{result.order.shippingResi || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Kode Verifikasi</span><span className="font-medium text-[#0d141b]">{result.order.verificationCode}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Produk</span><span className="font-medium text-[#0d141b]">{result.order.productTitle}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Total</span><span className="font-medium text-[#0d141b]">{formatPriceIdr(result.order.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Status</span><span className="font-medium text-[#0d141b]">{getOrderProgressLabel(result.order)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Tanggal</span><span className="font-medium text-[#0d141b]">{formatDateTimeId(result.order.createdAt)}</span></div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Resi tidak valid: {reasonLabel[result.reason || ""] || "Data tidak cocok"}
              </div>
            )}

            {!result.valid && result.order && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Resi Tumbas ditemukan, tetapi admin belum konfirmasi serah ke ekspedisi atau resi ekspedisi belum diinput.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
