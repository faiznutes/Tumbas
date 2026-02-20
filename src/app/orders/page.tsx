"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, PublicOrder } from "@/lib/api";
import {
  createReceiptNo,
  createResi,
  createVerificationCode,
  formatDateId,
  formatPriceIdr,
  getOrderProgressLabel,
} from "@/lib/order-presenter";
import {
  buildReceiptText,
  buildReceiptPrintHtml,
  createReceiptQrUrl,
  RECEIPT_FOOTER_TEXT,
} from "@/lib/receipt-print";
import { readPublicOrderRefs, savePublicOrderRef } from "@/lib/order-tracking";

function mapPublicOrderError(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  const message = raw.toLowerCase();

  if (message.includes("invalid order token")) {
    return "invalid_token" as const;
  }

  if (message.includes("order not found")) {
    return "order_not_found" as const;
  }

  if (message.includes("timeout")) {
    return "timeout" as const;
  }

  return "unknown" as const;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");

  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (orderId && token) {
      savePublicOrderRef(orderId, token);
    }

    async function loadOrders() {
      const refs = readPublicOrderRefs();

      if (refs.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setWarning("");

      const settled = await Promise.allSettled(
        refs.map(async (ref) => api.orders.getPublicById(ref.id, ref.token)),
      );

      const resolved = settled
        .filter((item): item is PromiseFulfilledResult<PublicOrder> => item.status === "fulfilled")
        .map((item) => item.value)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const failedReasons = settled
        .filter((item): item is PromiseRejectedResult => item.status === "rejected")
        .map((item) => mapPublicOrderError(item.reason));

      const invalidTokenCount = failedReasons.filter((reason) => reason === "invalid_token").length;
      const notFoundCount = failedReasons.filter((reason) => reason === "order_not_found").length;

      if (resolved.length === 0 && refs.length > 0) {
        if (invalidTokenCount > 0) {
          setError("Semua token pesanan tersimpan sudah tidak valid. Silakan buka lagi dari checkout/pending terbaru.");
        } else if (notFoundCount > 0) {
          setError("Pesanan tidak ditemukan di server. Silakan buat pesanan baru atau cek link yang digunakan.");
        } else {
          setError("Data pesanan tidak bisa dimuat. Periksa koneksi lalu coba lagi.");
        }
      } else if (resolved.length > 0 && (invalidTokenCount > 0 || notFoundCount > 0)) {
        setWarning("Sebagian pesanan lama disembunyikan karena token tidak valid atau data sudah tidak tersedia.");
      }

      setOrders(resolved);
      setLoading(false);
    }

    loadOrders();
  }, [orderId, token]);

  const orderCards = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        receiptNo: createReceiptNo(order.orderCode),
        shippingResi: createResi(order.orderCode),
        verificationCode: createVerificationCode(order.orderCode),
      })),
    [orders],
  );

  const handleDownloadReceipt = (order: PublicOrder) => {
    const text = buildReceiptText({
      orderId: order.id,
      orderCode: order.orderCode,
      receiptNo: createReceiptNo(order.orderCode),
      shippingResi: createResi(order.orderCode),
      verificationCode: createVerificationCode(order.orderCode),
      statusLabel: getOrderProgressLabel(order),
      productTitle: order.product.title,
      totalText: formatPriceIdr(order.amount),
      dateText: formatDateId(order.createdAt),
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${createReceiptNo(order.orderCode)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = (order: PublicOrder) => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const receiptNo = createReceiptNo(order.orderCode);
    const resi = createResi(order.orderCode);
    const verificationCode = createVerificationCode(order.orderCode);
    const qrUrl = createReceiptQrUrl(receiptNo, order.id, resi, verificationCode);
    const html = buildReceiptPrintHtml(
      {
        receiptNo,
        orderId: order.id,
        dateText: formatDateId(order.createdAt),
        shippingResi: resi,
        statusLabel: getOrderProgressLabel(order),
        productTitle: order.product.title,
        totalText: formatPriceIdr(order.amount),
        verificationCode,
        footerText: RECEIPT_FOOTER_TEXT,
      },
      qrUrl,
    );

    win.document.write(html);

    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <nav className="sticky top-0 z-50 w-full border-b border-[#e7edf3] bg-white flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-[#137fec]"><span className="material-symbols-outlined text-3xl">shopping_bag</span></div>
                <h1 className="text-xl font-bold tracking-tight text-[#0d141b] hidden sm:block">Tumbas</h1>
              </Link>
            </div>
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/">Beranda</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/shop">Belanja</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/about">Tentang</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/contact">Kontak</Link>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/cart" className="p-2 text-[#4c739a] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-full relative">
                <span className="material-symbols-outlined">shopping_cart</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#0d141b]">Pesanan Saya</h1>
          <Link href="/receipt/verify" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0d141b] hover:bg-slate-50">
            Verifikasi Resi
          </Link>
        </div>

        {loading && (
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6 text-[#4c739a]">Memuat riwayat pesanan...</div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && warning && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{warning}</div>
        )}

        {!loading && orderCards.length === 0 && !error && (
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6 text-sm text-[#4c739a]">
            Belum ada pesanan tersimpan di browser ini. Selesaikan checkout terlebih dahulu, lalu buka kembali halaman ini dari tombol &quot;Lihat Pesanan&quot;.
          </div>
        )}

        <div className="space-y-4">
          {orderCards.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-[#e7edf3] overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#0d141b]">{order.orderCode}</span>
                  <span className="text-[#4c739a]">{formatDateId(order.createdAt)}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                  {getOrderProgressLabel(order)}
                </span>
              </div>

              <div className="p-6">
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-[#4c739a]">Produk</span><span className="font-medium text-[#0d141b]">{order.product.title}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Total</span><span className="font-medium text-[#0d141b]">{formatPriceIdr(order.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">No. Receipt</span><span className="font-medium text-[#0d141b]">{order.receiptNo}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Resi Pengiriman</span><span className="font-medium text-[#0d141b]">{order.shippingResi}</span></div>
                  <div className="flex justify-between"><span className="text-[#4c739a]">Kode Verifikasi</span><span className="font-medium text-[#0d141b]">{order.verificationCode}</span></div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#e7edf3]">
                  <button
                    onClick={() => handleDownloadReceipt(order)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-[#0d141b] hover:bg-slate-100"
                  >
                    Download TXT
                  </button>
                  <button
                    onClick={() => handlePrintReceipt(order)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-[#0d141b] hover:bg-slate-100"
                  >
                    Cetak / Simpan PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
      <p className="text-[#4c739a]">Memuat...</p>
    </div>
  );
}

export default function Orders() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrdersContent />
    </Suspense>
  );
}
