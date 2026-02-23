"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, PublicOrder } from "@/lib/api";
import { formatPriceIdr } from "@/lib/order-presenter";
import Script from "next/script";
import Navbar from "@/components/layout/Navbar";

function getOrderLoadFailureReason(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  const message = raw.toLowerCase();

  if (message.includes("invalid order token")) return "invalid-token";
  if (message.includes("order not found")) return "order-not-found";
  if (message.includes("timeout")) return "timeout";
  return "unknown";
}

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(300);
  const [snapReady, setSnapReady] = useState(false);
  const [openingPayment, setOpeningPayment] = useState(false);

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";

  useEffect(() => {
    async function fetchOrder() {
      if (orderId) {
        try {
          if (!token) {
            setLoading(false);
            router.replace(`/payment/failed?orderId=${orderId}&reason=invalid-token`);
            return;
          }

          try {
            await api.orders.syncPaymentStatus(orderId, token);
          } catch {
            // continue with public fetch fallback; webhook might still process asynchronously
          }

          const data = await api.orders.getPublicById(orderId, token);
          setOrder(data);

          if (data.paymentStatus === "PAID") {
            localStorage.removeItem("pendingOrderId");
            router.replace(`/success?orderId=${orderId}&token=${encodeURIComponent(token)}`);
            return;
          }

          if (data.paymentStatus === "FAILED" || data.paymentStatus === "EXPIRED" || data.paymentStatus === "CANCELLED") {
            router.replace(`/payment/failed?orderId=${orderId}`);
            return;
          }
        } catch (err: unknown) {
          console.error("Failed to fetch order:", err);
          const reason = getOrderLoadFailureReason(err);
          router.replace(`/payment/failed?orderId=${orderId}&reason=${encodeURIComponent(reason)}`);
          return;
        }
      }
      setLoading(false);
    }

    fetchOrder();

    const pollId = setInterval(fetchOrder, 5000);
    return () => clearInterval(pollId);
  }, [orderId, router, token]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const openSnapPayment = async () => {
    if (!order?.snapToken) {
      return;
    }

    try {
      setOpeningPayment(true);

      const waitUntilReady = async () => {
        if (window.snap) return true;
        for (let i = 0; i < 12; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (window.snap) return true;
        }
        return false;
      };

      const ready = snapReady || (await waitUntilReady());
      if (!ready || !window.snap || !midtransClientKey) {
        return;
      }

      window.snap.pay(order.snapToken, {
        onSuccess: () => window.location.reload(),
        onPending: () => window.location.reload(),
        onError: () => router.push(`/payment/failed?orderId=${order.id}`),
        onClose: () => undefined,
      });
    } finally {
      setOpeningPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <p className="text-[#4c739a]">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <Navbar />

      <Script
        src={snapUrl}
        data-client-key={midtransClientKey || ""}
        strategy="afterInteractive"
        onLoad={() => setSnapReady(Boolean(window.snap))}
      />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-md:w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-yellow-500 text-5xl">schedule</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0d141b] mb-2">Menunggu Pembayaran</h1>
          <p className="text-[#4c739a] mb-4">
            Silakan selesaikan pembayaran dalam waktu
          </p>
          <div className="text-3xl font-bold text-[#0d141b] mb-8">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div className="bg-white rounded-xl border border-[#e7edf3] p-6 text-left mb-8">
            <h2 className="font-semibold text-[#0d141b] mb-4">Detail Pesanan</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Kode Pesanan</span>
                <span className="font-medium text-[#0d141b]">{order?.orderCode || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Produk</span>
                <span className="font-medium text-[#0d141b]">{order?.product?.title || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c739a]">Metode Pembayaran</span>
                <span className="font-medium text-[#0d141b]">Midtrans</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#e7edf3]">
                <span className="font-semibold text-[#0d141b]">Total</span>
                <span className="font-bold text-[#137fec]">{formatPriceIdr(order?.amount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-600">info</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Cara Pembayaran:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Buka aplikasi bank atau e-wallet Anda</li>
                  <li>Cari menu pembayaran atau transfer</li>
                  <li>Masukkan nomor VA atau kode pembayaran</li>
                  <li>Selesaikan pembayaran sebelum waktu habis</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={openSnapPayment}
              disabled={!order?.snapToken || !midtransClientKey || openingPayment}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined mr-2">payments</span>
              {openingPayment ? "Membuka Midtrans..." : "Lanjutkan Pembayaran"}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined mr-2">refresh</span>
              Periksa Status Pembayaran
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-[#e7edf3] text-[#0d141b] font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hubungi Kami jika Ada Masalah
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
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
      <p className="text-[#4c739a]">Memuat...</p>
    </div>
  );
}

export default function PaymentPending() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentPendingContent />
    </Suspense>
  );
}
