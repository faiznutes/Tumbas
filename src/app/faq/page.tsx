"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  { question: "Bagaimana cara memesan di Tumbas?", answer: "Pilih produk yang diinginkan, masukkan ke keranjang, lalu lanjut ke checkout. Isi data pengiriman dan pilih metode pembayaran." },
  { question: "Metode pembayaran apa saja yang tersedia?", answer: "Kami menerima pembayaran via Transfer Bank, ATM, E-Wallet (GoPay, OVO, DANA), dan COD (Bayar di Tempat)." },
  { question: "Berapa lama waktu pengiriman?", answer: "Waktu pengiriman tergantung lokasi. Untuk Jakarta 1-3 hari, luar Jakarta 3-7 hari kerja setelah pembayaran dikonfirmasi." },
  { question: "Bagaimana kebijakan pengembalian produk?", answer: "Anda dapat mengajukan pengembalian dalam 7 hari setelah penerimaan produk dengan kondisi belum digunakan dan kemasan asli." },
  { question: "Apakah saya bisa melacak pesanan?", answer: "Ya, nomor resi akan dikirimkan via email dan SMS setelah pesanan dikirim. Anda juga bisa melihat status di menu Pesanan Saya." },
  { question: "Bagaimana cara menghubungi customer service?", answer: "Hubungi kami via WhatsApp di 0812-3456-7890 atau email support@tumbas.id. Kami siap membantu 24/7." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/">Belanja</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/about">Tentang</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/contact">Kontak</Link>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/cart" className="p-2 text-[#4c739a] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-full relative">
                <span className="material-symbols-outlined">shopping_cart</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#137fec] text-white text-[10px] font-bold rounded-full border-2 border-white">0</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li><Link className="text-[#4c739a] hover:text-[#137fec]" href="/"><span className="material-symbols-outlined text-xl">home</span></Link></li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><span className="text-sm font-medium text-[#137fec]">FAQ</span></li>
          </ol>
        </nav>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#0d141b] mb-4">Pertanyaan Umum</h1>
            <p className="text-[#4c739a]">Temukan jawaban untuk pertanyaan yang sering diajukan</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-[#e7edf3] overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-[#0d141b]">{faq.question}</span>
                  <span className="material-symbols-outlined text-[#4c739a] transition-transform">
                    {openIndex === index ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-[#4c739a]">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[#4c739a] mb-4">Tidak menemukan jawaban yang Anda cari?</p>
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors">
              Hubungi Kami
            </Link>
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
