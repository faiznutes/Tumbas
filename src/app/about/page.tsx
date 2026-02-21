"use client";

import Link from "next/link";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#e7edf3] bg-white flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - KIRI */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-[#137fec]">
                  <span className="material-symbols-outlined text-3xl">shopping_bag</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#0d141b] hidden sm:block">
                  Tumbas
                </h1>
              </Link>
            </div>

            {/* Navigation Links - TENGAH */}
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec] transition-colors" href="/">
                Beranda
              </Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec] transition-colors" href="/">
                Belanja
              </Link>
              <Link className="text-sm font-medium text-[#137fec]" href="/about">
                Tentang
              </Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec] transition-colors" href="/contact">
                Kontak
              </Link>
            </div>

            {/* Icons - KANAN */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/cart" className="p-2 text-[#4c739a] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-full relative">
                <span className="material-symbols-outlined">shopping_cart</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#137fec] text-white text-[10px] font-bold rounded-full border-2 border-white">0</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li>
              <Link className="text-[#4c739a] hover:text-[#137fec]" href="/">
                <span className="material-symbols-outlined text-xl">home</span>
              </Link>
            </li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><span className="text-sm font-medium text-[#137fec]">Tentang Kami</span></li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#0d141b] mb-4">
            Tentang Kami
          </h1>
          <p className="text-lg text-[#4c739a] max-w-2xl">
            Tumbas adalah marketplace terpercaya yang berkomitmen memberikan pengalaman belanja online terbaik bagi konsumen Indonesia.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#0d141b] mb-4">
                Misi Kami
              </h2>
              <p className="text-[#4c739a] mb-4">
                Kami percaya bahwa belanja online harus mudah, aman, dan menyenangkan. Tumbas hadir untuk menghubungkan konsumen dengan produk berkualitas dari berbagai seller terpercaya.
              </p>
              <p className="text-[#4c739a]">
                Dengan teknologi modern dan layanan pelanggan terbaik, kami berkomitmen untuk terus meningkatkan pengalaman belanja Anda setiap hari.
              </p>
            </div>
            <div className="relative h-64 md:h-80 bg-gray-100 rounded-xl overflow-hidden">
              <img
                alt="Tumbas Team"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"
              />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#0d141b] mb-8 text-center">
            Nilai-Nilai Kami
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#e7edf3]">
              <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#137fec] text-2xl">verified_user</span>
              </div>
              <h3 className="font-bold text-[#0d141b] mb-2">Terpercaya</h3>
              <p className="text-sm text-[#4c739a]">
                Setiap transaksi dijamin keamanan dan keamanannya
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#e7edf3]">
              <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#137fec] text-2xl">support_agent</span>
              </div>
              <h3 className="font-bold text-[#0d141b] mb-2">Layanan 24/7</h3>
              <p className="text-sm text-[#4c739a]">
                Tim support siap membantu Anda kapan saja
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#e7edf3]">
              <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#137fec] text-2xl">local_shipping</span>
              </div>
              <h3 className="font-bold text-[#0d141b] mb-2">Pengiriman Cepat</h3>
              <p className="text-sm text-[#4c739a]">
                Produk dikirim dengan cepat dan aman ke seluruh Indonesia
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#e7edf3]">
              <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#137fec] text-2xl">thumb_up</span>
              </div>
              <h3 className="font-bold text-[#0d141b] mb-2">Kualitas Terjamin</h3>
              <p className="text-sm text-[#4c739a]">
                Produk asli dengan kualitas terbaik untuk Anda
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-16">
          <div className="bg-[#137fec] rounded-2xl p-8 md:p-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white mb-2">100+</div>
                <div className="text-white/80">Seller Aktif</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">50rb+</div>
                <div className="text-white/80">Produk Terjual</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">25rb+</div>
                <div className="text-white/80">Pelanggan Puas</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">4.9</div>
                <div className="text-white/80">Rating Toko</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-[#0d141b] mb-4">
            Mulai Belanja di Tumbas
          </h2>
          <p className="text-[#4c739a] mb-8 max-w-xl mx-auto">
            Temukan ribuan produk berkualitas dengan harga terbaik. Daftar sekarang dan nikmati pengalaman belanja online yang menyenangkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors"
            >
              Belanja Sekarang
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-[#137fec] text-[#137fec] hover:bg-[#137fec] hover:text-white font-semibold rounded-lg transition-colors"
            >
              Hubungi Kami
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e7edf3] py-12 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <span className="text-lg font-bold text-[#0d141b]">Tumbas</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#4c739a]">
              <Link href="/about" className="hover:text-[#137fec] transition-colors">
                Tentang
              </Link>
              <Link href="/terms" className="hover:text-[#137fec] transition-colors">
                Syarat & Ketentuan
              </Link>
              <Link href="/privacy" className="hover:text-[#137fec] transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/contact" className="hover:text-[#137fec] transition-colors">
                Kontak
              </Link>
            </div>

            <div className="text-sm text-[#4c739a] text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} Tumbas Inc. Seluruh hak cipta dilindungi.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
