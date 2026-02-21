"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    storeName: "Tumbas",
    storeEmail: "admin@tumbas.id",
    storePhone: "021-1234567",
    storeAddress: "Jakarta, Indonesia",
    currency: "IDR",
    taxRate: "11",
    shippingCost: "15000",
    minFreeShipping: "200000",
    emailNotifications: true,
    orderNotifications: true,
    marketingEmails: false,
  });

  const [promoSettings, setPromoSettings] = useState({
    heroImage: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBadge: '',
    discountText: '',
  });

  const [weeklyDealSettings, setWeeklyDealSettings] = useState({
    title: '',
    subtitle: '',
    enabled: true,
    discount: 20,
    endDate: '',
  });

  const [homepageFeaturedSettings, setHomepageFeaturedSettings] = useState({
    manualSlugs: [] as string[],
    maxItems: 3,
  });
  const [manualSlugsInput, setManualSlugsInput] = useState('');
  const [paymentSettings, setPaymentSettings] = useState({
    midtransEnabled: true,
    midtransClientKey: '',
    midtransServerKey: '',
    midtransIsProduction: false,
  });
  const [shippingSettings, setShippingSettings] = useState({
    minFreeShipping: 200000,
    estimateJawa: 15000,
    estimateLuarJawa: 30000,
    providers: ['JNE', 'J&T', 'SiCepat'],
  });
  const [shippingProvidersInput, setShippingProvidersInput] = useState('JNE, J&T, SiCepat');

  useEffect(() => {
    if (activeTab === 'promo') {
      fetchPromoSettings();
    } else if (activeTab === 'weekly') {
      fetchWeeklyDealSettings();
    } else if (activeTab === 'homepage-featured') {
      fetchHomepageFeaturedSettings();
    } else if (activeTab === 'payment') {
      fetchPaymentSettings();
    } else if (activeTab === 'shipping') {
      fetchShippingSettings();
    }
  }, [activeTab]);

  async function fetchPromoSettings() {
    try {
      const data = await api.settings.getPromo();
      setPromoSettings(data);
    } catch (error) {
      console.error('Failed to fetch promo settings:', error);
    }
  }

  async function fetchWeeklyDealSettings() {
    try {
      const data = await api.settings.getWeeklyDeal();
      setWeeklyDealSettings(data);
    } catch (error) {
      console.error('Failed to fetch weekly deal settings:', error);
    }
  }

  async function fetchHomepageFeaturedSettings() {
    try {
      const data = await api.settings.getHomepageFeatured();
      setHomepageFeaturedSettings(data);
      setManualSlugsInput(data.manualSlugs.join('\n'));
    } catch (error) {
      console.error('Failed to fetch homepage featured settings:', error);
    }
  }

  async function fetchPaymentSettings() {
    try {
      const data = await api.settings.getPayment();
      setPaymentSettings(data);
    } catch (error) {
      console.error('Failed to fetch payment settings:', error);
    }
  }

  async function fetchShippingSettings() {
    try {
      const data = await api.settings.getShipping();
      setShippingSettings(data);
      setShippingProvidersInput(data.providers.join(', '));
      setSettings((prev) => ({
        ...prev,
        shippingCost: String(data.estimateJawa),
        minFreeShipping: String(data.minFreeShipping),
      }));
    } catch (error) {
      console.error('Failed to fetch shipping settings:', error);
    }
  }

  async function savePromoSettings() {
    setLoading(true);
    try {
      await api.settings.updatePromo(promoSettings);
      addToast('Pengaturan promo berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save promo settings:', error);
      addToast('Gagal menyimpan pengaturan promo', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveWeeklyDealSettings() {
    setLoading(true);
    try {
      await api.settings.updateWeeklyDeal(weeklyDealSettings);
      addToast('Pengaturan penawaran mingguan berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save weekly deal settings:', error);
      addToast('Gagal menyimpan pengaturan penawaran mingguan', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveHomepageFeaturedSettings() {
    setLoading(true);
    try {
      const manualSlugs = manualSlugsInput
        .split(/[,\n]/)
        .map((slug) => slug.trim())
        .filter(Boolean)
        .slice(0, 8);

      const response = await api.settings.updateHomepageFeatured({
        manualSlugs,
        maxItems: homepageFeaturedSettings.maxItems,
      });

      setHomepageFeaturedSettings(response);
      setManualSlugsInput(response.manualSlugs.join('\n'));
      addToast('Pengaturan Kategori Pilihan berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save homepage featured settings:', error);
      addToast('Gagal menyimpan pengaturan Kategori Pilihan', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function savePaymentSettings() {
    setLoading(true);
    try {
      await api.settings.updatePayment(paymentSettings);
      addToast('Pengaturan Midtrans berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      addToast('Gagal menyimpan pengaturan Midtrans', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveShippingSettings() {
    setLoading(true);
    try {
      const providers = shippingProvidersInput.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
      const response = await api.settings.updateShipping({
        minFreeShipping: shippingSettings.minFreeShipping,
        estimateJawa: shippingSettings.estimateJawa,
        estimateLuarJawa: shippingSettings.estimateLuarJawa,
        providers,
      });
      setShippingSettings(response);
      setShippingProvidersInput(response.providers.join(', '));
      addToast('Pengaturan pengiriman berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save shipping settings:', error);
      addToast('Gagal menyimpan pengaturan pengiriman', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setSettings((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Pengaturan</h1>
          <p className="text-[#4c739a]">Kelola pengaturan toko Anda</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("general")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "general" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">store</span>
                <span className="text-sm font-medium">Umum</span>
              </button>
              <button
                onClick={() => setActiveTab("promo")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "promo" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">campaign</span>
                <span className="text-sm font-medium">Promo</span>
              </button>
              <button
                onClick={() => setActiveTab("weekly")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "weekly" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">local_offer</span>
                <span className="text-sm font-medium">Penawaran Mingguan</span>
              </button>
              <button
                onClick={() => setActiveTab("homepage-featured")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "homepage-featured"
                    ? "bg-[#137fec]/10 text-[#137fec]"
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">star</span>
                <span className="text-sm font-medium">Kategori Pilihan</span>
              </button>
              <button
                onClick={() => setActiveTab("store")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "store" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">inventory_2</span>
                <span className="text-sm font-medium">Toko</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "notifications" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="text-sm font-medium">Notifikasi</span>
              </button>
              <button
                onClick={() => setActiveTab("payment")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "payment" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="text-sm font-medium">Pembayaran</span>
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "shipping" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">local_shipping</span>
                <span className="text-sm font-medium">Pengiriman</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Umum</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Nama Toko
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={settings.storeName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div>
                  <label htmlFor="storeEmail" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Email Toko
                  </label>
                  <input
                    type="email"
                    id="storeEmail"
                    name="storeEmail"
                    value={settings.storeEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div>
                  <label htmlFor="storePhone" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Telepon Toko
                  </label>
                  <input
                    type="text"
                    id="storePhone"
                    name="storePhone"
                    value={settings.storePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div>
                  <label htmlFor="storeAddress" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Alamat Toko
                  </label>
                  <textarea
                    id="storeAddress"
                    name="storeAddress"
                    value={settings.storeAddress}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div className="pt-4">
                  <button className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "promo" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Promo (Halaman Utama)</h2>
              <p className="text-sm text-[#4c739a] mb-6">Kelola konten promo yang ditampilkan di halaman beranda</p>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="heroBadge" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Badge Promo
                  </label>
                  <input
                    type="text"
                    id="heroBadge"
                    value={promoSettings.heroBadge}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, heroBadge: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Contoh: Penawaran Terbatas"
                  />
                </div>

                <div>
                  <label htmlFor="heroTitle" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Judul Promo
                  </label>
                  <input
                    type="text"
                    id="heroTitle"
                    value={promoSettings.heroTitle}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Contoh: Sale Musim Panas: Hasta 50% Off"
                  />
                </div>

                <div>
                  <label htmlFor="heroSubtitle" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Subtitle Promo
                  </label>
                  <textarea
                    id="heroSubtitle"
                    value={promoSettings.heroSubtitle}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Contoh: Tingkatkan gaya hidup Anda dengan koleksi eksklusif kami."
                  />
                </div>

                <div>
                  <label htmlFor="heroImage" className="block text-sm font-medium text-[#0d141b] mb-2">
                    URL Gambar Banner
                  </label>
                  <input
                    type="url"
                    id="heroImage"
                    value={promoSettings.heroImage}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, heroImage: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="https://example.com/banner.jpg"
                  />
                  {promoSettings.heroImage && (
                    <div className="mt-3">
                      <img 
                        src={promoSettings.heroImage} 
                        alt="Preview" 
                        className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="discountText" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Teks Diskon
                  </label>
                  <input
                    type="text"
                    id="discountText"
                    value={promoSettings.discountText}
                    onChange={(e) => setPromoSettings(prev => ({ ...prev, discountText: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Contoh: 50% Off"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={savePromoSettings}
                    disabled={loading}
                    className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined">sync</span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "weekly" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Penawaran Mingguan</h2>
              <p className="text-sm text-[#4c739a] mb-6">Kelola konten penawaran mingguan di halaman beranda</p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Aktifkan Penawaran Mingguan</p>
                    <p className="text-sm text-[#4c739a]">Tampilkan bagian penawaran mingguan di halaman utama</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={weeklyDealSettings.enabled}
                      onChange={(e) => setWeeklyDealSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>

                <div>
                  <label htmlFor="weeklyTitle" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Judul
                  </label>
                  <input
                    type="text"
                    id="weeklyTitle"
                    value={weeklyDealSettings.title}
                    onChange={(e) => setWeeklyDealSettings(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Contoh: Penawaran Mingguan"
                  />
                </div>

                <div>
                  <label htmlFor="weeklySubtitle" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="weeklySubtitle"
                    value={weeklyDealSettings.subtitle}
                    onChange={(e) => setWeeklyDealSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Contoh: Ambil offers especiais sebelum habis"
                  />
                </div>

                <div>
                  <label htmlFor="weeklyDiscount" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    id="weeklyDiscount"
                    value={weeklyDealSettings.discount}
                    onChange={(e) => setWeeklyDealSettings(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label htmlFor="weeklyEndDate" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Tanggal Berakhir (Opsional)
                  </label>
                  <input
                    type="date"
                    id="weeklyEndDate"
                    value={weeklyDealSettings.endDate}
                    onChange={(e) => setWeeklyDealSettings(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={saveWeeklyDealSettings}
                    disabled={loading}
                    className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined">sync</span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "homepage-featured" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Kategori Pilihan (Beranda)</h2>
              <p className="text-sm text-[#4c739a] mb-6">
                Admin bisa isi slug produk pilihan manual. Slot sisanya otomatis diisi produk yang sedang ramai.
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="featuredMaxItems" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Jumlah kartu yang ditampilkan
                  </label>
                  <input
                    id="featuredMaxItems"
                    type="number"
                    min={1}
                    max={8}
                    value={homepageFeaturedSettings.maxItems}
                    onChange={(e) =>
                      setHomepageFeaturedSettings((prev) => ({
                        ...prev,
                        maxItems: Math.min(8, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>

                <div>
                  <label htmlFor="manualSlugs" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Slug produk manual (pisahkan per baris atau koma)
                  </label>
                  <textarea
                    id="manualSlugs"
                    rows={8}
                    value={manualSlugsInput}
                    onChange={(e) => setManualSlugsInput(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder={"sepatu-running-pria\njam-tangan-sport"}
                  />
                  <p className="mt-2 text-xs text-[#4c739a]">
                    Contoh: isi 1 slug manual, maka slot sisanya otomatis dari produk populer. Isi 2 slug manual juga bisa.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveHomepageFeaturedSettings}
                    disabled={loading}
                    className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined">sync</span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "store" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Toko</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Mata Uang
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  >
                    <option value="IDR">Rupiah (IDR)</option>
                    <option value="USD">Dollar (USD)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="taxRate" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Pajak (%)
                  </label>
                  <input
                    type="number"
                    id="taxRate"
                    name="taxRate"
                    value={settings.taxRate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div className="pt-4">
                  <button className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Notifikasi</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Notifikasi Email</p>
                    <p className="text-sm text-[#4c739a]">Terima notifikasi melalui email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="emailNotifications"
                      checked={settings.emailNotifications}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Notifikasi Pesanan</p>
                    <p className="text-sm text-[#4c739a]">Terima notifikasi saat ada pesanan baru</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="orderNotifications"
                      checked={settings.orderNotifications}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-[#0d141b]">Email Marketing</p>
                    <p className="text-sm text-[#4c739a]">Terima email tentang promo dan diskon</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="marketingEmails"
                      checked={settings.marketingEmails}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>
                <div className="pt-4">
                  <button className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Pembayaran</h2>
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">credit_card</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#0d141b]">Midtrans</p>
                      <p className="text-sm text-[#4c739a]">Konfigurasi pembayaran Midtrans</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${paymentSettings.midtransEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {paymentSettings.midtransEnabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-[#0d141b]">Aktifkan Midtrans</span>
                      <input
                        type="checkbox"
                        checked={paymentSettings.midtransEnabled}
                        onChange={(e) => setPaymentSettings((prev) => ({ ...prev, midtransEnabled: e.target.checked }))}
                      />
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Client Key</label>
                      <input
                        type="text"
                        value={paymentSettings.midtransClientKey}
                        onChange={(e) => setPaymentSettings((prev) => ({ ...prev, midtransClientKey: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Server Key</label>
                      <input
                        type="password"
                        value={paymentSettings.midtransServerKey}
                        onChange={(e) => setPaymentSettings((prev) => ({ ...prev, midtransServerKey: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                      />
                    </div>
                    <label className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-[#0d141b]">Mode Produksi</span>
                      <input
                        type="checkbox"
                        checked={paymentSettings.midtransIsProduction}
                        onChange={(e) => setPaymentSettings((prev) => ({ ...prev, midtransIsProduction: e.target.checked }))}
                      />
                    </label>
                  </div>
                </div>
                <div className="pt-4">
                  <button onClick={savePaymentSettings} disabled={loading} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Pengiriman</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="shippingCost" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Estimasi Ongkir Jawa (Rp)
                  </label>
                  <input
                    type="number"
                    id="shippingCost"
                    value={shippingSettings.estimateJawa}
                    onChange={(e) => setShippingSettings((prev) => ({ ...prev, estimateJawa: Number(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0d141b] mb-2">
                    Estimasi Ongkir Luar Jawa (Rp)
                  </label>
                  <input
                    type="number"
                    value={shippingSettings.estimateLuarJawa}
                    onChange={(e) => setShippingSettings((prev) => ({ ...prev, estimateLuarJawa: Number(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div>
                  <label htmlFor="minFreeShipping" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Gratis Ongkir Minimal (Rp)
                  </label>
                  <input
                    type="number"
                    id="minFreeShipping"
                    value={shippingSettings.minFreeShipping}
                    onChange={(e) => setShippingSettings((prev) => ({ ...prev, minFreeShipping: Number(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-600">local_shipping</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#0d141b]">Kurir Aktif</p>
                      <p className="text-sm text-[#4c739a]">Pisahkan dengan koma (contoh: JNE, J&T, SiCepat, AnterAja)</p>
                    </div>
                    <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{shippingSettings.providers.length} kurir</span>
                  </div>
                  <textarea
                    rows={2}
                    value={shippingProvidersInput}
                    onChange={(e) => setShippingProvidersInput(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div className="pt-4">
                  <button onClick={saveShippingSettings} disabled={loading} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
