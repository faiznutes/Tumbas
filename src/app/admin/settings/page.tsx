"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { ADMIN_SESSION_UPDATED_EVENT, getCurrentAdminUser, hasAdminPermission } from "@/lib/admin-permissions";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { addToast } = useToast();
  const [currentRole, setCurrentRole] = useState('');
  const [sessionRevision, setSessionRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const canEditAdminNotice = currentRole === 'SUPER_ADMIN';
  const hasGlobalSettingsView = hasAdminPermission('settings.view');
  const hasGlobalSettingsEdit = hasAdminPermission('settings.edit');
  
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
    selectedProductIds: [] as string[],
    discountType: 'percentage' as 'percentage' | 'amount',
    discountValue: 20,
    itemDiscounts: {} as Record<string, { discountType: 'percentage' | 'amount'; discountValue: number }>,
  });
  const [weeklyProductSearch, setWeeklyProductSearch] = useState('');

  const [homepageFeaturedSettings, setHomepageFeaturedSettings] = useState({
    manualSlugs: [] as string[],
    maxItems: 12,
    newArrivalsLimit: 12,
  });
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [featuredProductsCatalog, setFeaturedProductsCatalog] = useState<Array<{ id: string; title: string; slug: string; category: string | null }>>([]);
  const manualSlugList = homepageFeaturedSettings.manualSlugs;
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
    providers: ['jne', 'jnt', 'sicepat'],
    originCityId: 444,
    defaultWeightGram: 1000,
  });
  const [shippingProvidersInput, setShippingProvidersInput] = useState('jne, jnt, sicepat');
  const [adminNoticeSettings, setAdminNoticeSettings] = useState({
    enabled: false,
    title: 'Info Admin',
    message: '',
  });
  const [telegramSettings, setTelegramSettings] = useState({
    enabled: false,
    notifyOrderCreated: false,
    notifyPaymentPaid: true,
    chatIdsText: '',
    botToken: '',
    botTokenConfigured: false,
  });
  const [shopHeroSettings, setShopHeroSettings] = useState({
    badge: 'Koleksi Baru',
    title: 'Koleksi Musim Panas Telah Tiba',
    subtitle: 'Temukan tren aksesori terbaru dan nikmati diskon 20% untuk waktu terbatas.',
    image: '',
    ctaText: 'Belanja Sekarang',
  });

  const canViewTab = (tab: string) => {
    if (currentRole === 'SUPER_ADMIN') return true;
    if (tab === 'general') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.general.view') || hasAdminPermission('settings.general.edit');
    if (tab === 'promo') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.promo.view') || hasAdminPermission('settings.promo.edit');
    if (tab === 'weekly') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.weekly.view') || hasAdminPermission('settings.weekly.edit');
    if (tab === 'homepage-featured') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.featured.view') || hasAdminPermission('settings.featured.edit');
    if (tab === 'store') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.store.view') || hasAdminPermission('settings.store.edit');
    if (tab === 'notifications') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.notifications.view') || hasAdminPermission('settings.notifications.edit');
    if (tab === 'payment') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.payment.view') || hasAdminPermission('settings.payment.edit');
    if (tab === 'shipping') return hasGlobalSettingsView || hasGlobalSettingsEdit || hasAdminPermission('settings.shipping.view') || hasAdminPermission('settings.shipping.edit');
    if (tab === 'admin-notice') return hasAdminPermission('settings.notice.view') || canEditAdminNotice;
    if (tab === 'telegram') return canEditAdminNotice;
    return false;
  };

  const canEditTab = (tab: string) => {
    if (currentRole === 'SUPER_ADMIN') return true;
    if (tab === 'general') return hasGlobalSettingsEdit || hasAdminPermission('settings.general.edit');
    if (tab === 'promo') return hasGlobalSettingsEdit || hasAdminPermission('settings.promo.edit');
    if (tab === 'weekly') return hasGlobalSettingsEdit || hasAdminPermission('settings.weekly.edit');
    if (tab === 'homepage-featured') return hasGlobalSettingsEdit || hasAdminPermission('settings.featured.edit');
    if (tab === 'store') return hasGlobalSettingsEdit || hasAdminPermission('settings.store.edit');
    if (tab === 'notifications') return hasGlobalSettingsEdit || hasAdminPermission('settings.notifications.edit');
    if (tab === 'payment') return hasGlobalSettingsEdit || hasAdminPermission('settings.payment.edit');
    if (tab === 'shipping') return hasGlobalSettingsEdit || hasAdminPermission('settings.shipping.edit');
    if (tab === 'admin-notice') return canEditAdminNotice;
    if (tab === 'telegram') return canEditAdminNotice;
    return false;
  };
  const canEditAnySettings = ['general', 'promo', 'weekly', 'homepage-featured', 'store', 'notifications', 'payment', 'shipping', 'admin-notice', 'telegram']
    .some((tab) => canEditTab(tab));

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const processPromoImage = async (file: File) => {
    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    const size = 1600;
    canvas.width = size;
    canvas.height = Math.round(size * 0.5);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia');

    const targetWidth = canvas.width;
    const targetHeight = canvas.height;
    const ratio = Math.max(targetWidth / image.width, targetHeight / image.height);
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    const offsetX = (targetWidth - drawWidth) / 2;
    const offsetY = (targetHeight - drawHeight) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    return canvas.toDataURL('image/jpeg', 0.86);
  };

  useEffect(() => {
    const syncRole = () => {
      const user = getCurrentAdminUser();
      setCurrentRole(user.role || '');
      setSessionRevision((prev) => prev + 1);
    };
    syncRole();
    window.addEventListener(ADMIN_SESSION_UPDATED_EVENT, syncRole);
    window.addEventListener('storage', syncRole);
    return () => {
      window.removeEventListener(ADMIN_SESSION_UPDATED_EVENT, syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'general') {
      fetchGeneralSettings();
    } else if (activeTab === 'promo') {
      fetchPromoSettings();
    } else if (activeTab === 'weekly') {
      fetchWeeklyDealSettings();
    } else if (activeTab === 'homepage-featured') {
      fetchHomepageFeaturedSettings();
    } else if (activeTab === 'payment') {
      fetchPaymentSettings();
    } else if (activeTab === 'shipping') {
      fetchShippingSettings();
    } else if (activeTab === 'store') {
      fetchStoreSettings();
    } else if (activeTab === 'notifications') {
      fetchNotificationSettings();
    } else if (activeTab === 'admin-notice') {
      fetchAdminNoticeSettings();
    } else if (activeTab === 'telegram') {
      fetchTelegramSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!canViewTab(activeTab)) {
      const firstAllowed = ['general', 'promo', 'weekly', 'homepage-featured', 'store', 'notifications', 'payment', 'shipping', 'admin-notice', 'telegram']
        .find((tab) => canViewTab(tab));
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [activeTab, currentRole, sessionRevision]);

  async function fetchGeneralSettings() {
    try {
      const data = await api.settings.getGeneral();
      setSettings((prev) => ({
        ...prev,
        storeName: data.storeName,
        storeEmail: data.storeEmail,
        storePhone: data.storePhone,
        storeAddress: data.storeAddress,
      }));
    } catch (error) {
      console.error('Failed to fetch general settings:', error);
    }
  }

  async function fetchPromoSettings() {
    try {
      const [data, shopHero] = await Promise.all([
        api.settings.getPromo(),
        api.settings.getShopHero(),
      ]);
      setPromoSettings(data);
      setShopHeroSettings(shopHero);
    } catch (error) {
      console.error('Failed to fetch promo settings:', error);
    }
  }

  async function fetchWeeklyDealSettings() {
    try {
      const data = await api.settings.getWeeklyDeal();
      setWeeklyDealSettings({
        title: data.title || '',
        subtitle: data.subtitle || '',
        enabled: Boolean(data.enabled),
        discount: Number(data.discount) || 0,
        endDate: (data as any).endDate || (data as any).end_date || '',
        selectedProductIds: Array.isArray(data.selectedProductIds) ? data.selectedProductIds : [],
        discountType: data.discountType === 'amount' ? 'amount' : 'percentage',
        discountValue: Number(data.discountValue || data.discount || 0),
        itemDiscounts: (data as any).itemDiscounts && typeof (data as any).itemDiscounts === 'object'
          ? (data as any).itemDiscounts
          : {},
      });

      if (featuredProductsCatalog.length === 0) {
        const products = await api.products.getAll({ limit: 300, status: 'AVAILABLE', sort: 'newest' });
        setFeaturedProductsCatalog(
          (products.data || []).map((item) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            category: item.category,
          })),
        );
      }
    } catch (error) {
      console.error('Failed to fetch weekly deal settings:', error);
    }
  }

  async function fetchHomepageFeaturedSettings() {
    try {
      const [data, products] = await Promise.all([
        api.settings.getHomepageFeatured(),
        api.products.getAll({ limit: 200, status: 'AVAILABLE', sort: 'newest' }),
      ]);
        setHomepageFeaturedSettings({
          manualSlugs: data.manualSlugs,
          maxItems: Math.min(50, Math.max(1, data.maxItems || 12)),
          newArrivalsLimit: Math.min(64, Math.max(1, data.newArrivalsLimit || 12)),
        });
      setFeaturedProductsCatalog(
        (products.data || []).map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          category: item.category,
        })),
      );
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

  async function fetchStoreSettings() {
    try {
      const data = await api.settings.getStore();
      setSettings((prev) => ({
        ...prev,
        currency: data.currency,
        taxRate: String(data.taxRate),
      }));
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
    }
  }

  async function fetchNotificationSettings() {
    try {
      const data = await api.settings.getNotifications();
      setSettings((prev) => ({
        ...prev,
        emailNotifications: data.emailNotifications,
        orderNotifications: data.orderNotifications,
        marketingEmails: data.marketingEmails,
      }));
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    }
  }

  async function fetchAdminNoticeSettings() {
    try {
      const data = await api.settings.getAdminNotice();
      setAdminNoticeSettings(data);
    } catch (error) {
      console.error('Failed to fetch admin notice settings:', error);
    }
  }

  async function fetchTelegramSettings() {
    if (!canEditAdminNotice) {
      return;
    }

    try {
      const data = await api.settings.getTelegramSettings();
      setTelegramSettings({
        enabled: data.enabled,
        notifyOrderCreated: data.notifyOrderCreated,
        notifyPaymentPaid: data.notifyPaymentPaid,
        chatIdsText: (data.chatIds || []).join('\n'),
        botToken: data.botToken || '',
        botTokenConfigured: data.botTokenConfigured,
      });
    } catch (error) {
      console.error('Failed to fetch telegram settings:', error);
    }
  }

  async function saveGeneralSettings() {
    if (!canEditTab('general')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.settings.updateGeneral({
        storeName: settings.storeName,
        storeEmail: settings.storeEmail,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
      });
      setSettings((prev) => ({
        ...prev,
        storeName: response.storeName,
        storeEmail: response.storeEmail,
        storePhone: response.storePhone,
        storeAddress: response.storeAddress,
      }));
      addToast('Pengaturan umum berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save general settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan umum'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function savePromoSettings() {
    if (!canEditTab('promo')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.settings.updatePromo(promoSettings);
      addToast('Pengaturan promo berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save promo settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan promo'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveWeeklyDealSettings() {
    if (!canEditTab('weekly')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.settings.updateWeeklyDeal({
        title: weeklyDealSettings.title,
        subtitle: weeklyDealSettings.subtitle,
        enabled: weeklyDealSettings.enabled,
        discount: weeklyDealSettings.discount,
        endDate: weeklyDealSettings.endDate,
        selectedProductIds: weeklyDealSettings.selectedProductIds,
        discountType: weeklyDealSettings.discountType,
        discountValue: weeklyDealSettings.discountValue,
        itemDiscounts: Object.fromEntries(
          Object.entries(weeklyDealSettings.itemDiscounts || {}).filter(([productId]) => weeklyDealSettings.selectedProductIds.includes(productId)),
        ),
      });
      addToast('Pengaturan penawaran mingguan berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save weekly deal settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan penawaran mingguan'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveHomepageFeaturedSettings() {
    if (!canEditTab('homepage-featured')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.settings.updateHomepageFeatured({
        manualSlugs: homepageFeaturedSettings.manualSlugs,
        maxItems: homepageFeaturedSettings.maxItems,
        newArrivalsLimit: homepageFeaturedSettings.newArrivalsLimit,
      });

      setHomepageFeaturedSettings(response);
      addToast('Pengaturan Kategori Pilihan berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save homepage featured settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan Kategori Pilihan'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function savePaymentSettings() {
    if (!canEditTab('payment')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.settings.updatePayment(paymentSettings);
      addToast('Pengaturan Midtrans berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan Midtrans'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveStoreSettings() {
    if (!canEditTab('store')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      const store = await api.settings.updateStore({
        taxRate: Number(settings.taxRate) || 0,
      });
      setSettings((prev) => ({
        ...prev,
        taxRate: String(store.taxRate),
      }));
      addToast('Pengaturan pajak berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save store settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan pajak'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveNotificationSettings() {
    if (!canEditTab('notifications')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.settings.updateNotifications({
        emailNotifications: settings.emailNotifications,
        orderNotifications: settings.orderNotifications,
        marketingEmails: settings.marketingEmails,
      });
      setSettings((prev) => ({
        ...prev,
        emailNotifications: response.emailNotifications,
        orderNotifications: response.orderNotifications,
        marketingEmails: response.marketingEmails,
      }));
      addToast('Pengaturan notifikasi berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan notifikasi'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveShippingSettings() {
    if (!canEditTab('shipping')) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan', 'warning');
      return;
    }

    setLoading(true);
    try {
      const providers = shippingProvidersInput.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
      const response = await api.settings.updateShipping({
        minFreeShipping: shippingSettings.minFreeShipping,
        estimateJawa: shippingSettings.estimateJawa,
        estimateLuarJawa: shippingSettings.estimateLuarJawa,
        providers,
        originCityId: shippingSettings.originCityId,
        defaultWeightGram: shippingSettings.defaultWeightGram,
      });
      setShippingSettings(response);
      setShippingProvidersInput(response.providers.join(', '));
      addToast('Pengaturan pengiriman berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save shipping settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan pengiriman'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveShopHeroSettings() {
    if (!canEditTab('promo')) {
      addToast('Anda tidak memiliki izin untuk mengubah Summer Collection', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.settings.updateShopHero(shopHeroSettings);
      setShopHeroSettings(response);
      addToast('Pengaturan Summer Collection berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save shop hero settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan Summer Collection'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveAdminNoticeSettings() {
    if (!canEditAdminNotice) {
      addToast('Hanya Super Admin yang dapat mengubah admin notice', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.settings.updateAdminNotice(adminNoticeSettings);
      setAdminNoticeSettings(response);
      addToast('Admin notice berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save admin notice settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan admin notice'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveTelegramSettings() {
    if (!canEditAdminNotice) {
      addToast('Hanya Super Admin yang dapat mengubah Telegram Bot', 'warning');
      return;
    }

    setLoading(true);
    try {
      const chatIds = telegramSettings.chatIdsText
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await api.settings.updateTelegramSettings({
        enabled: telegramSettings.enabled,
        notifyOrderCreated: telegramSettings.notifyOrderCreated,
        notifyPaymentPaid: telegramSettings.notifyPaymentPaid,
        chatIds,
        botToken: telegramSettings.botToken,
      });

      setTelegramSettings({
        enabled: response.enabled,
        notifyOrderCreated: response.notifyOrderCreated,
        notifyPaymentPaid: response.notifyPaymentPaid,
        chatIdsText: (response.chatIds || []).join('\n'),
        botToken: response.botToken || '',
        botTokenConfigured: response.botTokenConfigured,
      });
      addToast('Pengaturan Telegram Bot berhasil disimpan', 'success');
    } catch (error) {
      console.error('Failed to save telegram settings:', error);
      addToast(getErrorMessage(error, 'Gagal menyimpan pengaturan Telegram Bot'), 'error');
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

      {!canEditAnySettings && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mode hanya lihat: akun ini tidak memiliki izin untuk mengubah pengaturan.
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <nav className="grid grid-cols-4 gap-2 lg:block lg:space-y-1">
              {canViewTab("general") && (<button
                onClick={() => setActiveTab("general")}
                title="Umum"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "general" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">store</span>
                <span className="hidden text-sm font-medium lg:inline">Umum</span>
              </button>)}
              {canViewTab("promo") && (<button
                onClick={() => setActiveTab("promo")}
                title="Promo"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "promo" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">campaign</span>
                <span className="hidden text-sm font-medium lg:inline">Promo</span>
              </button>)}
              {canViewTab("weekly") && (<button
                onClick={() => setActiveTab("weekly")}
                title="Penawaran Mingguan"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "weekly" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">local_offer</span>
                <span className="hidden text-sm font-medium lg:inline">Penawaran Mingguan</span>
              </button>)}
              {canViewTab("homepage-featured") && (<button
                onClick={() => setActiveTab("homepage-featured")}
                title="Kategori Pilihan"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "homepage-featured"
                    ? "bg-[#137fec]/10 text-[#137fec]"
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">star</span>
                <span className="hidden text-sm font-medium lg:inline">Kategori Pilihan</span>
              </button>)}
              {canViewTab("store") && (<button
                onClick={() => setActiveTab("store")}
                title="Pajak"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "store" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">inventory_2</span>
                <span className="hidden text-sm font-medium lg:inline">Toko</span>
              </button>)}
              {canViewTab("notifications") && (<button
                onClick={() => setActiveTab("notifications")}
                title="Notifikasi"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "notifications" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="hidden text-sm font-medium lg:inline">Notifikasi</span>
              </button>)}
              {canViewTab("admin-notice") && (<button
                onClick={() => setActiveTab("admin-notice")}
                title="Admin Notice"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "admin-notice"
                    ? "bg-[#137fec]/10 text-[#137fec]"
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">campaign</span>
                <span className="hidden text-sm font-medium lg:inline">Admin Notice</span>
              </button>)}
              {canViewTab("telegram") && (<button
                onClick={() => setActiveTab("telegram")}
                title="Telegram Bot"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "telegram"
                    ? "bg-[#137fec]/10 text-[#137fec]"
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">send</span>
                <span className="hidden text-sm font-medium lg:inline">Telegram Bot</span>
              </button>)}
              {canViewTab("payment") && (<button
                onClick={() => setActiveTab("payment")}
                title="Pembayaran"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "payment" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="hidden text-sm font-medium lg:inline">Pembayaran</span>
              </button>)}
              {canViewTab("shipping") && (<button
                onClick={() => setActiveTab("shipping")}
                title="Pengiriman"
                className={`w-full flex items-center justify-center gap-2 px-2 py-3 rounded-lg transition-colors lg:justify-start lg:px-4 ${
                  activeTab === "shipping" 
                    ? "bg-[#137fec]/10 text-[#137fec]" 
                    : "text-[#4c739a] hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">local_shipping</span>
                <span className="hidden text-sm font-medium lg:inline">Pengiriman</span>
              </button>)}
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
                  <button onClick={saveGeneralSettings} disabled={loading || !canEditTab('general')} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                    placeholder="Contoh: Sale Musim Panas: Hingga Diskon 50%"
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
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-[#0d141b]">Upload Gambar Banner</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const imageBase64 = await processPromoImage(file);
                          setPromoSettings((prev) => ({ ...prev, heroImage: imageBase64 }));
                          addToast('Gambar banner berhasil diproses', 'success');
                        } catch (error) {
                          addToast(getErrorMessage(error, 'Gagal memproses gambar banner'), 'error');
                        } finally {
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
                    />
                  </div>
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
                    disabled={loading || !canEditTab('promo')}
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

                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-bold text-[#0d141b] mb-4">Summer Collection (Halaman Shop)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Badge</label>
                      <input
                        type="text"
                        value={shopHeroSettings.badge}
                        onChange={(e) => setShopHeroSettings((prev) => ({ ...prev, badge: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                        placeholder="Contoh: Koleksi Baru"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Judul</label>
                      <input
                        type="text"
                        value={shopHeroSettings.title}
                        onChange={(e) => setShopHeroSettings((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                        placeholder="Contoh: Koleksi Musim Panas Telah Tiba"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Subtitle</label>
                      <textarea
                        rows={3}
                        value={shopHeroSettings.subtitle}
                        onChange={(e) => setShopHeroSettings((prev) => ({ ...prev, subtitle: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">URL Gambar</label>
                      <input
                        type="url"
                        value={shopHeroSettings.image}
                        onChange={(e) => setShopHeroSettings((prev) => ({ ...prev, image: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Teks Tombol</label>
                      <input
                        type="text"
                        value={shopHeroSettings.ctaText}
                        onChange={(e) => setShopHeroSettings((prev) => ({ ...prev, ctaText: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                        placeholder="Contoh: Belanja Sekarang"
                      />
                    </div>

                    <button
                      onClick={saveShopHeroSettings}
                      disabled={loading || !canEditTab('promo')}
                      className="bg-[#0d141b] hover:bg-[#1f2a37] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Menyimpan...' : 'Simpan Summer Collection'}
                    </button>
                  </div>
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
                    placeholder="Contoh: Ambil promo spesial sebelum habis"
                  />
                </div>

                <div>
                  <label htmlFor="weeklyDiscountType" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Jenis Diskon
                  </label>
                  <select
                    id="weeklyDiscountType"
                    value={weeklyDealSettings.discountType}
                    onChange={(e) => setWeeklyDealSettings(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'amount' }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="amount">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="weeklyDiscountValue" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    id="weeklyDiscountValue"
                    min={0}
                    max={weeklyDealSettings.discountType === 'percentage' ? 100 : undefined}
                    value={weeklyDealSettings.discountValue}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      setWeeklyDealSettings((prev) => ({
                        ...prev,
                        discount: value,
                        discountValue: prev.discountType === 'percentage' ? Math.min(100, value) : value,
                      }));
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder={weeklyDealSettings.discountType === 'percentage' ? '20' : '10000'}
                  />
                  <p className="mt-1 text-xs text-[#4c739a]">
                    {weeklyDealSettings.discountType === 'percentage'
                      ? 'Masukkan diskon dalam persen (0-100).'
                      : 'Masukkan diskon nominal rupiah per produk terpilih.'}
                  </p>
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

                <div>
                  <label htmlFor="weeklyProductsSearch" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Produk Terpilih untuk Diskon
                  </label>
                  <input
                    id="weeklyProductsSearch"
                    type="text"
                    value={weeklyProductSearch}
                    onChange={(e) => setWeeklyProductSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Cari nama produk atau slug"
                  />

                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#4c739a]">
                        Produk diskon ({weeklyDealSettings.selectedProductIds.length})
                      </p>
                      {canEditTab('weekly') && weeklyDealSettings.selectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setWeeklyDealSettings((prev) => ({ ...prev, selectedProductIds: [], itemDiscounts: {} }))}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Hapus semua
                        </button>
                      )}
                    </div>

                    {weeklyDealSettings.selectedProductIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {weeklyDealSettings.selectedProductIds.map((id) => {
                          const product = featuredProductsCatalog.find((item) => item.id === id);
                          return (
                            <span key={id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-[#0d141b]">
                              {product?.title || id}
                              {canEditTab('weekly') && (
                                <button
                                  type="button"
                          onClick={() => setWeeklyDealSettings((prev) => ({
                                    ...prev,
                                    selectedProductIds: prev.selectedProductIds.filter((item) => item !== id),
                                    itemDiscounts: Object.fromEntries(Object.entries(prev.itemDiscounts || {}).filter(([key]) => key !== id)),
                                  }))}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#4c739a]">Belum ada produk dipilih.</p>
                    )}
                  </div>

                  {weeklyDealSettings.selectedProductIds.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c739a]">Pengaturan diskon per item</p>
                      <div className="space-y-2">
                        {weeklyDealSettings.selectedProductIds.map((productId) => {
                          const product = featuredProductsCatalog.find((item) => item.id === productId);
                          const itemDiscount = weeklyDealSettings.itemDiscounts[productId] || {
                            discountType: weeklyDealSettings.discountType,
                            discountValue: weeklyDealSettings.discountValue,
                          };

                          return (
                            <div key={`discount-${productId}`} className="grid gap-2 rounded-lg border border-slate-200 p-2 md:grid-cols-[1fr_160px_160px]">
                              <p className="truncate text-sm font-medium text-[#0d141b]">{product?.title || productId}</p>
                              <select
                                value={itemDiscount.discountType}
                                disabled={!canEditTab('weekly')}
                                onChange={(e) => {
                                  const discountType = e.target.value as 'percentage' | 'amount';
                                  setWeeklyDealSettings((prev) => ({
                                    ...prev,
                                    itemDiscounts: {
                                      ...prev.itemDiscounts,
                                      [productId]: {
                                        discountType,
                                        discountValue: prev.itemDiscounts[productId]?.discountValue || prev.discountValue,
                                      },
                                    },
                                  }));
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
                              >
                                <option value="percentage">Persen (%)</option>
                                <option value="amount">Nominal (Rp)</option>
                              </select>
                              <input
                                type="number"
                                min={0}
                                max={itemDiscount.discountType === 'percentage' ? 100 : undefined}
                                disabled={!canEditTab('weekly')}
                                value={itemDiscount.discountValue}
                                onChange={(e) => {
                                  const discountValue = Math.max(0, Number(e.target.value) || 0);
                                  setWeeklyDealSettings((prev) => ({
                                    ...prev,
                                    itemDiscounts: {
                                      ...prev.itemDiscounts,
                                      [productId]: {
                                        discountType: prev.itemDiscounts[productId]?.discountType || prev.discountType,
                                        discountValue,
                                      },
                                    },
                                  }));
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                    {featuredProductsCatalog
                      .filter((item) => {
                        const keyword = weeklyProductSearch.trim().toLowerCase();
                        if (!keyword) return true;
                        return item.title.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword);
                      })
                      .slice(0, 100)
                      .map((item) => {
                        const selected = weeklyDealSettings.selectedProductIds.includes(item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 last:border-b-0">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#0d141b]">{item.title}</p>
                              <p className="truncate text-xs text-[#4c739a]">{item.slug}{item.category ? ` - ${item.category}` : ''}</p>
                            </div>
                            <button
                              type="button"
                              disabled={!canEditTab('weekly')}
                              onClick={() => {
                                setWeeklyDealSettings((prev) => {
                                  if (prev.selectedProductIds.includes(item.id)) {
                                    return {
                                      ...prev,
                                      selectedProductIds: prev.selectedProductIds.filter((id) => id !== item.id),
                                      itemDiscounts: Object.fromEntries(Object.entries(prev.itemDiscounts || {}).filter(([key]) => key !== item.id)),
                                    };
                                  }
                                  return {
                                    ...prev,
                                    selectedProductIds: [...prev.selectedProductIds, item.id],
                                    itemDiscounts: {
                                      ...prev.itemDiscounts,
                                      [item.id]: prev.itemDiscounts[item.id] || {
                                        discountType: prev.discountType,
                                        discountValue: prev.discountValue,
                                      },
                                    },
                                  };
                                });
                              }}
                              className={`ml-3 rounded-md px-3 py-1 text-xs font-medium ${selected ? 'bg-red-50 text-red-700' : 'bg-[#137fec]/10 text-[#137fec]'} disabled:opacity-50`}
                            >
                              {selected ? 'Hapus' : 'Pilih'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={saveWeeklyDealSettings}
                    disabled={loading || !canEditTab('weekly')}
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
                    max={50}
                    value={homepageFeaturedSettings.maxItems}
                    onChange={(e) =>
                      setHomepageFeaturedSettings((prev) => ({
                        ...prev,
                        maxItems: Math.min(50, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>

                <div>
                  <label htmlFor="newArrivalsLimit" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Jumlah Produk Baru Default
                  </label>
                  <input
                    id="newArrivalsLimit"
                    type="number"
                    min={1}
                    max={64}
                    value={homepageFeaturedSettings.newArrivalsLimit}
                    onChange={(e) =>
                      setHomepageFeaturedSettings((prev) => ({
                        ...prev,
                        newArrivalsLimit: Math.min(64, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                  <p className="mt-1 text-xs text-[#4c739a]">Saat Penawaran Mingguan nonaktif, beranda otomatis menampilkan minimal 16 produk terbaru.</p>
                </div>

                <div>
                  <label htmlFor="featuredSearch" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Pilih Produk (dengan pencarian)
                  </label>
                  <input
                    id="featuredSearch"
                    type="text"
                    value={featuredSearch}
                    onChange={(e) => setFeaturedSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="Cari nama produk atau slug"
                  />

                  {manualSlugList.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#4c739a]">Produk terpilih ({manualSlugList.length})</p>
                        {canEditTab('homepage-featured') && (
                          <button
                            type="button"
                            onClick={() => setHomepageFeaturedSettings((prev) => ({ ...prev, manualSlugs: [] }))}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Hapus semua
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {manualSlugList.map((slug) => (
                          <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-[#0d141b] border border-slate-200">
                            {slug}
                            {canEditTab('homepage-featured') && (
                              <button
                                type="button"
                                onClick={() => setHomepageFeaturedSettings((prev) => ({
                                  ...prev,
                                  manualSlugs: prev.manualSlugs.filter((item) => item !== slug),
                                }))}
                                className="text-red-600 hover:text-red-700"
                                title="Hapus produk"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                    {featuredProductsCatalog
                      .filter((item) => {
                        const keyword = featuredSearch.trim().toLowerCase();
                        if (!keyword) return true;
                        return item.title.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword);
                      })
                      .slice(0, 80)
                      .map((item) => {
                        const selected = homepageFeaturedSettings.manualSlugs.includes(item.slug);
                        return (
                          <div key={item.id} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 last:border-b-0">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#0d141b]">{item.title}</p>
                              <p className="truncate text-xs text-[#4c739a]">{item.slug}{item.category ? ` - ${item.category}` : ''}</p>
                            </div>
                            <button
                              type="button"
                              disabled={!canEditTab('homepage-featured')}
                              onClick={() => {
                                setHomepageFeaturedSettings((prev) => {
                                  if (prev.manualSlugs.includes(item.slug)) {
                                    return { ...prev, manualSlugs: prev.manualSlugs.filter((slug) => slug !== item.slug) };
                                  }
                                  return { ...prev, manualSlugs: [...prev.manualSlugs, item.slug] };
                                });
                              }}
                              className={`ml-3 rounded-md px-3 py-1 text-xs font-medium ${selected ? 'bg-red-50 text-red-700' : 'bg-[#137fec]/10 text-[#137fec]'} disabled:opacity-50`}
                            >
                              {selected ? 'Hapus' : 'Pilih'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveHomepageFeaturedSettings}
                    disabled={loading || !canEditTab('homepage-featured')}
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
              <h2 className="text-lg font-bold text-[#0d141b] mb-6">Pengaturan Pajak</h2>
              <div className="space-y-6">
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
                  <p className="mt-1 text-xs text-[#4c739a]">Contoh: nilai 11 berarti total pembayaran ditambah pajak 11%.</p>
                </div>
                <div className="pt-4">
                  <button onClick={saveStoreSettings} disabled={loading || !canEditTab('store')} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                  <button onClick={saveNotificationSettings} disabled={loading || !canEditTab('notifications')} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                  <button onClick={savePaymentSettings} disabled={loading || !canEditTab('payment')} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "admin-notice" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-2">Admin Notice (Login Admin)</h2>
              <p className="text-sm text-[#4c739a] mb-6">
                Notice ini tampil di halaman login admin. Admin dapat melihat, tetapi hanya Super Admin yang dapat mengubah.
              </p>

              {!canEditAdminNotice && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Mode hanya lihat: hanya Super Admin yang dapat mengaktifkan, menonaktifkan, atau mengubah admin notice.
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Status Notice</p>
                    <p className="text-sm text-[#4c739a]">Aktifkan untuk menampilkan notice di login admin</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminNoticeSettings.enabled}
                      onChange={(e) => setAdminNoticeSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                      disabled={!canEditAdminNotice}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>

                <div>
                  <label htmlFor="adminNoticeTitle" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Judul Notice
                  </label>
                  <input
                    type="text"
                    id="adminNoticeTitle"
                    value={adminNoticeSettings.title}
                    onChange={(e) => setAdminNoticeSettings((prev) => ({ ...prev, title: e.target.value }))}
                    disabled={!canEditAdminNotice}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b] disabled:bg-slate-100"
                    placeholder="Contoh: Informasi Pemeliharaan"
                  />
                </div>

                <div>
                  <label htmlFor="adminNoticeMessage" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Pesan Notice
                  </label>
                  <textarea
                    id="adminNoticeMessage"
                    rows={4}
                    value={adminNoticeSettings.message}
                    onChange={(e) => setAdminNoticeSettings((prev) => ({ ...prev, message: e.target.value }))}
                    disabled={!canEditAdminNotice}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b] disabled:bg-slate-100"
                    placeholder="Contoh: Akan ada maintenance pada pukul 02:00 WIB."
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveAdminNoticeSettings}
                    disabled={loading || !canEditAdminNotice}
                    className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "telegram" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#0d141b] mb-2">Telegram Bot Notifikasi</h2>
              <p className="text-sm text-[#4c739a] mb-6">
                Khusus Super Admin. Atur notifikasi Telegram untuk order baru dan pembayaran sukses.
              </p>

              {!canEditAdminNotice && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Hanya Super Admin yang dapat melihat dan mengubah pengaturan Telegram Bot.
                </div>
              )}

              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#4c739a]">
                  Status Token Bot: <span className={`font-semibold ${telegramSettings.botTokenConfigured ? 'text-green-700' : 'text-red-700'}`}>{telegramSettings.botTokenConfigured ? 'Tersedia' : 'Belum di-set'}</span>
                </div>

                <div>
                  <label htmlFor="telegramBotToken" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Telegram Bot Token
                  </label>
                  <input
                    type="password"
                    id="telegramBotToken"
                    value={telegramSettings.botToken}
                    onChange={(e) => setTelegramSettings((prev) => ({ ...prev, botToken: e.target.value }))}
                    disabled={!canEditAdminNotice}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b] disabled:bg-slate-100"
                    placeholder="Contoh: 123456789:AA..."
                  />
                  <p className="mt-2 text-xs text-[#4c739a]">Bisa diisi langsung di sini oleh Super Admin. Kosongkan jika ingin fallback dari env backend.</p>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Aktifkan Telegram Bot</p>
                    <p className="text-sm text-[#4c739a]">Global switch notifikasi telegram</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramSettings.enabled}
                      onChange={(e) => setTelegramSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                      disabled={!canEditAdminNotice}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Notifikasi Order Baru</p>
                    <p className="text-sm text-[#4c739a]">Jika aktif, order baru (belum dibayar) akan dikirim ke Telegram</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramSettings.notifyOrderCreated}
                      onChange={(e) => setTelegramSettings((prev) => ({ ...prev, notifyOrderCreated: e.target.checked }))}
                      disabled={!canEditAdminNotice}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-[#0d141b]">Notifikasi Pembayaran Sukses</p>
                    <p className="text-sm text-[#4c739a]">Jika aktif, status PAID dari Midtrans akan dikirim ke Telegram</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramSettings.notifyPaymentPaid}
                      onChange={(e) => setTelegramSettings((prev) => ({ ...prev, notifyPaymentPaid: e.target.checked }))}
                      disabled={!canEditAdminNotice}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#137fec] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec]"></div>
                  </label>
                </div>

                <div>
                  <label htmlFor="telegramChatIds" className="block text-sm font-medium text-[#0d141b] mb-2">
                    Chat ID Tujuan (bisa lebih dari satu)
                  </label>
                  <textarea
                    id="telegramChatIds"
                    rows={5}
                    value={telegramSettings.chatIdsText}
                    onChange={(e) => setTelegramSettings((prev) => ({ ...prev, chatIdsText: e.target.value }))}
                    disabled={!canEditAdminNotice}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b] disabled:bg-slate-100"
                    placeholder={"Contoh:\n1229311218\n-1001234567890"}
                  />
                  <p className="mt-2 text-xs text-[#4c739a]">Pisahkan dengan baris baru atau koma. Harus numeric (contoh user: 1229311218, group: -1001234567890).</p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveTelegramSettings}
                    disabled={loading || !canEditAdminNotice}
                    className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan Telegram'}
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
                  <label className="block text-sm font-medium text-[#0d141b] mb-2">Origin City ID RajaOngkir (Surabaya)</label>
                  <input
                    type="number"
                    value={shippingSettings.originCityId}
                    onChange={(e) => setShippingSettings((prev) => ({ ...prev, originCityId: Number(e.target.value) || 444 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0d141b] mb-2">Berat Default Produk (gram)</label>
                  <input
                    type="number"
                    value={shippingSettings.defaultWeightGram}
                    onChange={(e) => setShippingSettings((prev) => ({ ...prev, defaultWeightGram: Number(e.target.value) || 1000 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  />
                </div>
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
                      <p className="text-sm text-[#4c739a]">Pisahkan dengan koma (contoh: jne, jnt, sicepat)</p>
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
                  <button onClick={saveShippingSettings} disabled={loading || !canEditTab('shipping')} className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
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
