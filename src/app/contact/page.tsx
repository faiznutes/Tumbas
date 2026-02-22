"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.contactMessages.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        subject: formData.subject,
        message: formData.message,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        subject: "",
        message: "",
      });
      addToast("Pesan berhasil dikirim. Tim kami akan segera menghubungi Anda.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim pesan";
      addToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li><Link className="text-[#4c739a] hover:text-[#137fec]" href="/"><span className="material-symbols-outlined text-xl">home</span></Link></li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><span className="text-sm font-medium text-[#137fec]">Hubungi Kami</span></li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#0d141b] mb-4">Hubungi Kami</h1>
          <p className="text-lg text-[#4c739a] max-w-2xl">
            Punya pertanyaan atau butuh bantuan? Kami siap membantu Anda 24/7.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-[#0d141b] mb-6">Informasi Kontak</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#137fec] text-xl">location_on</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0d141b] mb-1">Alamat</h3>
                  <p className="text-[#4c739a]">
                   Jl. Merdeka No. 123<br />
                    Jakarta Pusat 10110<br />
                    Indonesia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#137fec] text-xl">phone</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0d141b] mb-1">Telepon</h3>
                   <a href="tel:+622112345678" className="text-[#4c739a] hover:text-[#137fec]">(021) 1234-5678</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#137fec] text-xl">email</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0d141b] mb-1">Email</h3>
                  <p className="text-[#4c739a]">support@tumbas.id</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#137fec] text-xl">chat</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0d141b] mb-1">WhatsApp</h3>
                   <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="text-[#4c739a] hover:text-[#137fec]">0812-3456-7890</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#137fec]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#137fec] text-xl">schedule</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0d141b] mb-1">Jam Operasional</h3>
                  <p className="text-[#4c739a]">24/7 - Kami siap membantu kapan saja</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8">
              <h3 className="font-semibold text-[#0d141b] mb-4">Ikuti Kami</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-[#137fec] rounded-full flex items-center justify-center text-white hover:bg-[#0f65bd] transition-colors">
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a href="#" className="w-10 h-10 bg-[#137fec] rounded-full flex items-center justify-center text-white hover:bg-[#0f65bd] transition-colors">
                  <span className="material-symbols-outlined">email</span>
                </a>
                <a href="#" className="w-10 h-10 bg-[#137fec] rounded-full flex items-center justify-center text-white hover:bg-[#0f65bd] transition-colors">
                  <span className="material-symbols-outlined">tv</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-[#0d141b] mb-6">Kirim Pesan</h2>
            <div className="bg-white rounded-xl border border-[#e7edf3] p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#0d141b] mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#0d141b] placeholder-[#4c739a]"
                      placeholder="Nama Anda"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#0d141b] mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#0d141b] placeholder-[#4c739a]"
                      placeholder="email@contoh.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#0d141b] mb-2">Nomor Telepon</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#0d141b] placeholder-[#4c739a]"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-[#0d141b] mb-2">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#0d141b] placeholder-[#4c739a]"
                      placeholder="628xxxxxxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[#0d141b] mb-2">Subjek</label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#0d141b]"
                    required
                  >
                    <option value="">Pilih subjek</option>
                    <option value="order">Pesanan & Pengiriman</option>
                    <option value="product">Produk & Stok</option>
                    <option value="payment">Pembayaran</option>
                    <option value="return">Pengembalian & Penukaran</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#0d141b] mb-2">Pesan</label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#0d141b] placeholder-[#4c739a] resize-none"
                    placeholder="Tulis pesan Anda..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">{submitting ? "sync" : "send"}</span>
                  {submitting ? "Mengirim..." : "Kirim Pesan"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
            <div className="text-sm text-[#4c739a]">
              <p>&copy; {new Date().getFullYear()} Tumbas Inc.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
