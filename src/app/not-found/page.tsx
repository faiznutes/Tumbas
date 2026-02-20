"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      {/* Navbar */}
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
              <Link href="/admin/login" className="ml-2 w-8 h-8 rounded-full bg-[#137fec] flex items-center justify-center text-white font-bold text-sm">T</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-slate-400 text-6xl">search_off</span>
          </div>

          <h1 className="text-4xl font-bold text-[#0d141b] mb-2">404</h1>
          <h2 className="text-xl font-semibold text-[#0d141b] mb-4">Halaman Tidak Ditemukan</h2>
          <p className="text-[#4c739a] mb-8">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined mr-2">home</span>
              Kembali ke Beranda
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-[#e7edf3] text-[#0d141b] font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined mr-2">shopping_bag</span>
              Belanja Sekarang
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
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
