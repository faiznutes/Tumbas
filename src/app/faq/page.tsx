"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

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
      <Navbar />

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
