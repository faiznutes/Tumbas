"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");

  const reasonMessage: Record<string, string> = {
    "invalid-token": "Link pesanan tidak valid atau token sudah tidak berlaku. Silakan mulai ulang checkout.",
    "order-not-found": "Data pesanan tidak ditemukan di server.",
    timeout: "Koneksi ke server timeout saat memuat status pembayaran.",
    unknown: "Status pembayaran tidak dapat diverifikasi saat ini.",
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

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0d141b] mb-2">Pembayaran Gagal</h1>
          <p className="text-[#4c739a] mb-8">
            Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi.
          </p>

          {reason && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800">
              {reasonMessage[reason] || reasonMessage.unknown}
            </div>
          )}

          {orderId && (
            <div className="bg-white rounded-xl border border-[#e7edf3] p-6 text-left mb-8">
              <h2 className="font-semibold text-[#0d141b] mb-4">Detail Pesanan</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4c739a]">ID Pesanan</span>
                  <span className="font-medium text-[#0d141b]">{orderId}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors"
            >
              Coba Lagi
            </Link>
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

export default function PaymentFailed() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailedContent />
    </Suspense>
  );
}
