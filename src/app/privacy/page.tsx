"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function Privacy() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li><Link className="text-[#4c739a] hover:text-[#137fec]" href="/"><span className="material-symbols-outlined text-xl">home</span></Link></li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><span className="text-sm font-medium text-[#137fec]">Kebijakan Privasi</span></li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-[#0d141b] mb-4">Kebijakan Privasi</h1>
          <p className="text-[#4c739a] mb-8">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">1. Pendahuluan</h2>
              <p className="text-[#4c739a]">Kebijakan Privasi ini menjelaskan bagaimana Tumbas mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda. Dengan menggunakan layanan Tumbas, Anda setuju dengan kebijakan ini.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">2. Informasi yang Kami Kumpulkan</h2>
              <ul className="list-disc pl-6 space-y-2 text-[#4c739a]">
                <li>Informasi akun: nama, email, nomor telepon</li>
                <li>Informasi transaksi: riwayat pesanan, metode pembayaran</li>
                <li>Informasi pengiriman: alamat, kode pos</li>
                <li>Data penggunaan: aktivitas di platform, preferensi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">3. Penggunaan Informasi</h2>
              <p className="text-[#4c739a] mb-2">Informasi yang kami kumpulkan digunakan untuk:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#4c739a]">
                <li>Memproses pesanan dan pengiriman</li>
                <li>Menghubungi Anda terkait pesanan</li>
                <li>Memberikan layanan pelanggan</li>
                <li>Meningkatkan pengalaman pengguna</li>
                <li>Mengirim informasi promosi (dengan persetujuan)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">4. Perlindungan Data</h2>
              <p className="text-[#4c739a]">Kami menerapkan langkah-langkah keamanan yang ketat untuk melindungi informasi pribadi Anda, termasuk enkripsi data dan keamanan server.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">5. Berbagi Informasi</h2>
              <p className="text-[#4c739a]">Kami tidak menjual informasi pribadi Anda. Informasi hanya dibagikan dengan:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#4c739a]">
                <li>Partner pengiriman untuk pengiriman pesanan</li>
                <li>Pihak ketiga untuk pemrosesan pembayaran</li>
                <li>Dengan persetujuan Anda</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">6. Hak Pengguna</h2>
              <p className="text-[#4c739a] mb-2">Anda memiliki hak untuk:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#4c739a]">
                <li>Mengakses informasi pribadi Anda</li>
                <li>Memperbaiki informasi yang tidak akurat</li>
                <li>Meminta penghapusan data</li>
                <li>Menolak pemasaran langsung</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0d141b] mb-4">7. Kontak</h2>
              <p className="text-[#4c739a]">Jika ada pertanyaan tentang kebijakan privasi ini, hubungi kami:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#4c739a] mt-2">
                <li>Email: privacy@tumbas.id</li>
                <li>WhatsApp: 0812-3456-7890</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#e7edf3] py-12 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]"><span className="material-symbols-outlined text-2xl">shopping_bag</span></div>
              <span className="text-lg font-bold text-[#0d141b]">Tumbas</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#4c739a]">
              <Link href="/about" className="hover:text-[#137fec]">Tentang</Link>
              <Link href="/terms" className="hover:text-[#137fec]">Syarat & Ketentuan</Link>
              <Link href="/privacy" className="hover:text-[#137fec]">Kebijakan Privasi</Link>
              <Link href="/contact" className="hover:text-[#137fec]">Kontak</Link>
            </div>
            <div className="text-sm text-[#4c739a]"><p>&copy; {new Date().getFullYear()} Tumbas Inc.</p></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
