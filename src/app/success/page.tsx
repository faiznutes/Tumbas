"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, PublicOrder } from "@/lib/api";
import {
  createReceiptNo,
  createResi,
  createVerificationCode,
  formatDateTimeId,
  formatPriceIdr,
  getOrderProgressLabel,
} from "@/lib/order-presenter";
import {
  buildReceiptText,
  buildReceiptPrintHtml,
  createReceiptQrUrl,
  RECEIPT_FOOTER_TEXT,
} from "@/lib/receipt-print";
import { savePublicOrderRef } from "@/lib/order-tracking";

function getPublicOrderErrorMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  const message = raw.toLowerCase();

  if (message.includes("invalid order token")) {
    return "Token akses pesanan tidak valid atau sudah tidak berlaku. Buka kembali dari halaman checkout/pending terbaru.";
  }

  if (message.includes("order not found")) {
    return "Pesanan tidak ditemukan. Pastikan link sukses sesuai dengan pesanan terbaru.";
  }

  if (message.includes("timeout")) {
    return "Gagal memuat detail receipt karena koneksi timeout. Silakan refresh halaman.";
  }

  return "Detail receipt belum bisa dimuat saat ini.";
}

function getOrderItemLines(order: PublicOrder | null) {
  if (!order) return ["-"];
  if (order.orderItems && order.orderItems.length > 0) {
    return order.orderItems.map((item) => {
      const variant = item.selectedVariantLabel ? ` (${item.selectedVariantLabel})` : "";
      return `${item.quantity}x ${item.productTitleSnapshot}${variant}`;
    });
  }
  return [order.product.title];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);

  const receiptNo = order ? createReceiptNo(order.orderCode) : orderId ? `RCPT-${orderId}` : "-";
  const shippingResi = order ? createResi(order.orderCode) : orderId ? createResi(orderId) : "-";
  const verificationCode = order ? createVerificationCode(order.orderCode) : orderId ? createVerificationCode(orderId) : "-";

  const handleDownloadReceipt = () => {
    if (!order && !orderId) return;

    const safeOrderId = order?.id || orderId;
    if (!safeOrderId) return;

    const dateText = order ? formatDateTimeId(order.createdAt) : formatDateTimeId(new Date().toISOString());
    const itemLines = getOrderItemLines(order);
    const productText = itemLines[0] || "-";
    const totalText = order ? formatPriceIdr(order.amount) : "-";
    const text = buildReceiptText({
      orderId: safeOrderId,
      orderCode: order?.orderCode || "-",
      receiptNo,
      shippingResi,
      statusLabel: getOrderProgressLabel(order),
      dateText,
      productTitle: productText,
      itemLines,
      totalText,
      verificationCode,
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receiptNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    if (!order && !orderId) return;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const dateText = order ? formatDateTimeId(order.createdAt) : formatDateTimeId(new Date().toISOString());
    const itemLines = getOrderItemLines(order);
    const productText = itemLines[0] || "-";
    const totalText = order ? formatPriceIdr(order.amount) : "-";
    const safeOrderId = order?.id || orderId;
    if (!safeOrderId) return;

    const qrUrl = createReceiptQrUrl(receiptNo, safeOrderId, shippingResi, verificationCode);
    const html = buildReceiptPrintHtml(
      {
        receiptNo,
        orderId: safeOrderId,
        dateText,
        shippingResi,
        statusLabel: getOrderProgressLabel(order),
        productTitle: productText,
        itemLines,
        totalText,
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

  useEffect(() => {
    setMounted(true);
    if (orderId) {
      localStorage.removeItem("pendingOrderId");
    }
    if (orderId && token) {
      savePublicOrderRef(orderId, token);
    }
  }, [orderId, token]);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId || !token) return;

      try {
        setLoadingOrder(true);
        setOrderError("");
        try {
          await api.orders.syncPaymentStatus(orderId, token);
        } catch {
          // ignore sync error and continue fetching public order data
        }
        const data = await api.orders.getPublicById(orderId, token);
        setOrder(data);
      } catch (err: unknown) {
        setOrder(null);
        setOrderError(getPublicOrderErrorMessage(err));
      } finally {
        setLoadingOrder(false);
      }
    }

    loadOrder();
  }, [orderId, token]);

  useEffect(() => {
    if (!orderId || !token || !order || order.paymentStatus === "PAID") return;

    let attempts = 0;
    setCheckingPayment(true);
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        try {
          await api.orders.syncPaymentStatus(orderId, token);
        } catch {
          // ignore sync error and keep polling public status
        }
        const data = await api.orders.getPublicById(orderId, token);
        setOrder(data);
        if (data.paymentStatus === "PAID" || attempts >= 6) {
          clearInterval(timer);
          setCheckingPayment(false);
        }
      } catch {
        if (attempts >= 6) {
          clearInterval(timer);
          setCheckingPayment(false);
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [order, orderId, token]);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

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

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
          </div>
          
          <h1 className="text-3xl font-bold text-[#0d141b] mb-4">{order?.paymentStatus === "PAID" ? "Pembayaran Berhasil!" : "Pesanan Berhasil!"}</h1>
          <p className="text-[#4c739a] mb-8">{order?.paymentStatus === "PAID" ? "Pembayaran telah kami terima. Resi dan nota tersedia di bawah untuk disimpan." : "Pesanan telah dibuat. Sistem sedang sinkronisasi status pembayaran Anda."}</p>
          
          {orderId && (
            <div className="bg-white rounded-xl border border-[#e7edf3] p-6 mb-8">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e7edf3]">
                <span className="text-[#4c739a]">Nomor Pesanan</span>
                <span className="font-bold text-[#0d141b]">{orderId}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e7edf3]">
                <span className="text-[#4c739a]">No. Receipt</span>
                <span className="font-semibold text-[#0d141b]">{receiptNo}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e7edf3]">
                <span className="text-[#4c739a]">Resi Pengiriman</span>
                <span className="font-semibold text-[#0d141b]">{shippingResi}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e7edf3]">
                <span className="text-[#4c739a]">Kode Verifikasi</span>
                <span className="font-semibold text-[#0d141b]">{verificationCode}</span>
              </div>
              {loadingOrder ? (
                <div className="text-sm text-[#4c739a] mb-4">Memuat detail receipt...</div>
              ) : order ? (
                <>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e7edf3]">
                    <span className="text-[#4c739a]">Produk</span>
                    <span className="font-medium text-[#0d141b] text-right">{getOrderItemLines(order).join(" • ")}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#e7edf3]">
                    <span className="text-[#4c739a]">Total</span>
                    <span className="font-semibold text-[#0d141b]">{formatPriceIdr(order.amount)}</span>
                  </div>
                </>
              ) : orderError ? (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {orderError}
                </div>
              ) : null}
              <div className="flex justify-between items-center">
                <span className="text-[#4c739a]">Status</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${order?.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{order?.paymentStatus === "PAID" ? "Pembayaran Berhasil" : getOrderProgressLabel(order)}</span>
              </div>
              {checkingPayment && (
                <p className="mt-3 text-xs text-[#4c739a]">Sedang sinkronisasi status pembayaran...</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadReceipt}
              className="inline-flex items-center justify-center px-6 py-3 border border-[#e7edf3] text-[#0d141b] font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Download TXT
            </button>
            <button
              onClick={handlePrintReceipt}
              className="inline-flex items-center justify-center px-6 py-3 border border-[#e7edf3] text-[#0d141b] font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cetak / Simpan PDF
            </button>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors">
              Belanja Lagi
            </Link>
            <Link href={orderId && token ? `/orders?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}` : "/orders"} className="inline-flex items-center justify-center px-6 py-3 border border-[#e7edf3] text-[#0d141b] font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Lihat Pesanan
            </Link>
            <Link href="/receipt/verify" className="inline-flex items-center justify-center px-6 py-3 border border-[#e7edf3] text-[#0d141b] font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Verifikasi Resi
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#e7edf3] py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]"><span className="material-symbols-outlined text-2xl">shopping_bag</span></div>
              <span className="text-lg font-bold text-[#0d141b]">Tumbas</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#4c739a]">
              <Link href="/about" className="hover:text-[#137fec]">Tentang</Link>
              <Link href="/faq" className="hover:text-[#137fec]">FAQ</Link>
              <Link href="/terms" className="hover:text-[#137fec]">Syarat & Ketentuan</Link>
              <Link href="/privacy" className="hover:text-[#137fec]">Kebijakan Privasi</Link>
              <Link href="/contact" className="hover:text-[#137fec]">Kontak</Link>
            </div>
            <p className="text-sm text-[#4c739a]">© 2026 Tumbas Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
