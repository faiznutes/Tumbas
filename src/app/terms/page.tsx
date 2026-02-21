"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <Navbar />

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
            <li><span className="text-sm font-medium text-[#137fec]">Syarat & Ketentuan</span></li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#0d141b] mb-4">
            Syarat & Ketentuan
          </h1>
          <p className="text-lg text-[#4c739a] max-w-2xl">
            Harap baca syarat dan ketentuan ini dengan seksama sebelum menggunakan layanan Tumbas.
          </p>
          <p className="text-sm text-[#4c739a] mt-2">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Terms Content */}
        <div className="max-w-4xl">
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              1. Pendahuluan
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Dengan mengakses dan menggunakan layanan Tumbas, Anda setuju untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat dan ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
              </p>
              <p>
                Tumbas berhak untuk memperbarui syarat dan ketentuan ini kapan saja tanpa pemberitahuan terlebih dahulu. Penggunaan berkelanjutan Anda terhadap layanan ini setelah adanya perubahan akan dianggap sebagai penerimaan Anda terhadap syarat dan ketentuan yang telah diubah.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              2. Akun Pengguna
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>Untuk menggunakan layanan Tumbas, Anda mungkin perlu membuat akun. Anda bertanggung jawab untuk:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Menyediakan informasi yang akurat dan lengkap saat pendaftaran</li>
                <li>Menjaga keamanan kata sandi dan akun Anda</li>
                <li>Segera memberitahu kami jika ada penggunaan tanpa izin atau pelanggaran keamanan</li>
                <li>Bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              3. Pembelian & Pembayaran
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>Ketika Anda melakukan pembelian melalui Tumbas, Anda setuju untuk:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Menyediakan informasi pembayaran yang valid dan akurat</li>
                <li>Membayar harga yang tercantum untuk produk yang Anda beli</li>
                <li>Mematuhi semua syarat dan ketentuan yang berlaku untuk pembayaran</li>
                <li>Menunggu konfirmasi pesanan sebelum pengiriman dilakukan</li>
              </ul>
              <p className="mt-4">
                Tumbas berhak untuk membatalkan pesanan jika ada kecurigaan penipuan atau pelanggaran syarat dan ketentuan.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              4. Kebijakan Pengembalian & Penukaran
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Kami berkomitmen untuk memberikan pengalaman belanja yang memuaskan. Jika produk yang Anda terima tidak sesuai dengan pesanan atau mengalami kerusakan, Anda dapat mengajukan pengembalian atau penukaran dalam waktu 7 hari setelah penerimaan produk.
              </p>
              <p>Produk yang dapat dikembalikan harus:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Belum digunakan dan dalam kondisi semula</li>
                <li>Memiliki semua kemasan dan label asli</li>
                <li>Disertai dengan bukti pembelian</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              5. Harga & Ketersediaan Produk
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Semua harga yang tercantum di Tumbas sudah termasuk pajak dan dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Ketersediaan produk tidak dijamin dan dapat berubah tergantung pada stok yang tersedia.
              </p>
              <p>
                Jika terdapat kesalahan harga pada produk yang telah Anda pesan, kami akan menginformasikan Anda dan memberikan opsi untuk melanjutkan pesanan dengan harga yang benar atau membatalkan pesanan.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              6. Kebijakan Privasi
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Privasi Anda penting bagi kami. Kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda sesuai dengan Kebijakan Privasi kami. Dengan menggunakan layanan Tumbas, Anda setuju dengan praktik privasi kami.
              </p>
              <p>
                Untuk informasi lebih lanjut tentang bagaimana kami menangani data pribadi Anda, silakan lihat Kebijakan Privasi kami di halaman terkait.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              7. Batasan Tanggung Jawab
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Tumbas tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami.
              </p>
              <p>
                Total tanggung jawab Tumbas tidak akan melebihi jumlah yang telah Anda bayarkan untuk produk atau layanan yang menjadi dasar klaim.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              8. Hukum yang Mengatur
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan oleh pengadilan yang memiliki yurisdiksi di Indonesia.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0d141b] mb-4">
              9. Hubungi Kami
            </h2>
            <div className="text-[#4c739a] space-y-4">
              <p>
                Jika Anda memiliki pertanyaan atau masalah terkait syarat dan ketentuan ini, jangan ragu untuk menghubungi kami melalui:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: support@tumbas.id</li>
                <li>Telepon: (021) 1234-5678</li>
                <li>WhatsApp: 0812-3456-7890</li>
              </ul>
            </div>
          </section>
        </div>
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
              <p>&copy; {new Date().getFullYear()} Tumbas Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
