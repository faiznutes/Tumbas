import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSetting(key: string) {
    const setting = await this.prisma.siteSettings.findUnique({
      where: { key },
    });
    return setting?.value;
  }

  async setSetting(key: string, value: string) {
    return this.prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getAllSettings() {
    const settings = await this.prisma.siteSettings.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    return result;
  }

  async setSettings(data: object) {
    const updates = Object.entries(data)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => this.setSetting(key, value as string));
    return Promise.all(updates);
  }

  async getPromoSettings() {
    const defaults = {
      heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      heroTitle: 'Sale Musim Panas: Hingga Diskon 50%',
      heroSubtitle: 'Tingkatkan gaya hidup Anda dengan koleksi eksklusif kami. Dari teknologi tinggi hingga fashion premium.',
      heroBadge: 'Penawaran Terbatas',
      discountText: '50% Off',
    };

    const keys = [
      'promo_hero_image',
      'promo_hero_title',
      'promo_hero_subtitle',
      'promo_hero_badge',
      'promo_discount_text',
      // backward compatibility with older key names
      'heroImage',
      'heroTitle',
      'heroSubtitle',
      'heroBadge',
      'discountText',
    ];

    const settings = await this.prisma.siteSettings.findMany({
      where: { key: { in: keys } },
    });

    const result = { ...defaults };
    settings.forEach((setting) => {
      if (setting.key === 'promo_hero_image' || setting.key === 'heroImage') result.heroImage = setting.value;
      if (setting.key === 'promo_hero_title' || setting.key === 'heroTitle') result.heroTitle = setting.value;
      if (setting.key === 'promo_hero_subtitle' || setting.key === 'heroSubtitle') result.heroSubtitle = setting.value;
      if (setting.key === 'promo_hero_badge' || setting.key === 'heroBadge') result.heroBadge = setting.value;
      if (setting.key === 'promo_discount_text' || setting.key === 'discountText') result.discountText = setting.value;
    });

    return result;
  }

  async setPromoSettings(data: {
    heroImage?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroBadge?: string;
    discountText?: string;
  }) {
    const updates: Promise<any>[] = [];

    if (data.heroImage !== undefined) updates.push(this.setSetting('promo_hero_image', data.heroImage));
    if (data.heroTitle !== undefined) updates.push(this.setSetting('promo_hero_title', data.heroTitle));
    if (data.heroSubtitle !== undefined) updates.push(this.setSetting('promo_hero_subtitle', data.heroSubtitle));
    if (data.heroBadge !== undefined) updates.push(this.setSetting('promo_hero_badge', data.heroBadge));
    if (data.discountText !== undefined) updates.push(this.setSetting('promo_discount_text', data.discountText));

    if (updates.length > 0) await Promise.all(updates);
    return this.getPromoSettings();
  }

  async getWeeklyDealSettings() {
    const defaults = {
      title: 'Penawaran Mingguan',
      subtitle: 'Ambil promo spesial sebelum habis',
      enabled: true,
      discount: 20,
      endDate: '',
      selectedProductIds: [] as string[],
      discountType: 'percentage' as 'percentage' | 'amount',
      discountValue: 0,
    };

    const weeklyDealKeys = [
      'weekly_deal_title',
      'weekly_deal_subtitle',
      'weekly_deal_enabled',
      'weekly_deal_discount',
      'weekly_deal_end_date',
      'weekly_deal_selected_product_ids',
      'weekly_deal_discount_type',
      'weekly_deal_discount_value',
    ];
    const weeklyDealSettings = await this.prisma.siteSettings.findMany({
      where: { key: { in: weeklyDealKeys } },
    });

    const result: Record<string, any> = { ...defaults };
    weeklyDealSettings.forEach(s => {
      if (s.key === 'weekly_deal_enabled') {
        result.enabled = s.value === 'true';
      } else if (s.key === 'weekly_deal_discount') {
        result.discount = parseInt(s.value) || 20;
      } else if (s.key === 'weekly_deal_discount_type') {
        result.discountType = s.value === 'amount' ? 'amount' : 'percentage';
      } else if (s.key === 'weekly_deal_discount_value') {
        result.discountValue = Math.max(0, parseInt(s.value, 10) || 0);
      } else if (s.key === 'weekly_deal_selected_product_ids') {
        result.selectedProductIds = s.value
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 100);
      } else if (s.key === 'weekly_deal_end_date') {
        result.endDate = s.value;
      } else {
        const key = s.key.replace('weekly_deal_', '');
        result[key] = s.value;
      }
    });

    if (!result.discountValue || result.discountValue <= 0) {
      result.discountValue = result.discount;
    }

    return result;
  }

  async getHomepageFeaturedSettings() {
    const defaults = {
      manualSlugs: [] as string[],
      maxItems: 12,
    };

    const keys = ['homepage_featured_manual_slugs', 'homepage_featured_max_items'];
    const settings = await this.prisma.siteSettings.findMany({
      where: { key: { in: keys } },
    });

    const result = { ...defaults };
    settings.forEach((setting) => {
      if (setting.key === 'homepage_featured_manual_slugs') {
        result.manualSlugs = setting.value
          .split(',')
          .map((slug) => slug.trim())
          .filter(Boolean);
      }

      if (setting.key === 'homepage_featured_max_items') {
        const parsed = parseInt(setting.value, 10);
        result.maxItems = Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : defaults.maxItems;
      }
    });

    return result;
  }

  async getPaymentSettings() {
    const envClientKey = process.env.MIDTRANS_CLIENT_KEY || '';
    const envServerKey = process.env.MIDTRANS_SERVER_KEY || '';
    const envIsProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    const defaults = {
      midtransEnabled: Boolean(envClientKey),
      midtransClientKey: envClientKey,
      midtransServerKey: envServerKey,
      midtransIsProduction: envIsProduction,
    };

    const keys = [
      'payment_midtrans_enabled',
      'payment_midtrans_client_key',
      'payment_midtrans_server_key',
      'payment_midtrans_is_production',
    ];

    const settings = await this.prisma.siteSettings.findMany({
      where: { key: { in: keys } },
    });

    const result = { ...defaults };
    settings.forEach((setting) => {
      if (setting.key === 'payment_midtrans_enabled') result.midtransEnabled = setting.value === 'true';
      if (setting.key === 'payment_midtrans_client_key') result.midtransClientKey = setting.value;
      if (setting.key === 'payment_midtrans_server_key') result.midtransServerKey = setting.value;
      if (setting.key === 'payment_midtrans_is_production') result.midtransIsProduction = setting.value === 'true';
    });

    return result;
  }

  async setPaymentSettings(data: {
    midtransEnabled?: boolean;
    midtransClientKey?: string;
    midtransServerKey?: string;
    midtransIsProduction?: boolean;
  }) {
    const updates: Promise<any>[] = [];

    if (data.midtransEnabled !== undefined) updates.push(this.setSetting('payment_midtrans_enabled', String(data.midtransEnabled)));
    if (data.midtransClientKey !== undefined) updates.push(this.setSetting('payment_midtrans_client_key', data.midtransClientKey));
    if (data.midtransServerKey !== undefined) updates.push(this.setSetting('payment_midtrans_server_key', data.midtransServerKey));
    if (data.midtransIsProduction !== undefined) updates.push(this.setSetting('payment_midtrans_is_production', String(data.midtransIsProduction)));

    if (updates.length > 0) await Promise.all(updates);
    return this.getPaymentSettings();
  }

  async getShippingSettings() {
    const defaults = {
      minFreeShipping: 200000,
      estimateJawa: 15000,
      estimateLuarJawa: 30000,
      providers: ['jne', 'jnt', 'sicepat'],
      originCityId: 444,
      defaultWeightGram: 1000,
    };

    const keys = [
      'shipping_min_free',
      'shipping_estimate_jawa',
      'shipping_estimate_luar_jawa',
      'shipping_providers',
      'shipping_origin_city_id',
      'shipping_default_weight_gram',
    ];

    const settings = await this.prisma.siteSettings.findMany({
      where: { key: { in: keys } },
    });

    const result = { ...defaults };
    settings.forEach((setting) => {
      if (setting.key === 'shipping_min_free') result.minFreeShipping = parseInt(setting.value, 10) || defaults.minFreeShipping;
      if (setting.key === 'shipping_estimate_jawa') result.estimateJawa = parseInt(setting.value, 10) || defaults.estimateJawa;
      if (setting.key === 'shipping_estimate_luar_jawa') result.estimateLuarJawa = parseInt(setting.value, 10) || defaults.estimateLuarJawa;
      if (setting.key === 'shipping_providers') {
        result.providers = setting.value.split(',').map((v) => v.trim()).filter(Boolean);
      }
      if (setting.key === 'shipping_origin_city_id') result.originCityId = parseInt(setting.value, 10) || defaults.originCityId;
      if (setting.key === 'shipping_default_weight_gram') result.defaultWeightGram = parseInt(setting.value, 10) || defaults.defaultWeightGram;
    });

    return result;
  }

  async setShippingSettings(data: {
    minFreeShipping?: number;
    estimateJawa?: number;
    estimateLuarJawa?: number;
    providers?: string[];
    originCityId?: number;
    defaultWeightGram?: number;
  }) {
    const updates: Promise<any>[] = [];

    if (data.minFreeShipping !== undefined) updates.push(this.setSetting('shipping_min_free', String(Math.max(0, data.minFreeShipping))));
    if (data.estimateJawa !== undefined) updates.push(this.setSetting('shipping_estimate_jawa', String(Math.max(0, data.estimateJawa))));
    if (data.estimateLuarJawa !== undefined) updates.push(this.setSetting('shipping_estimate_luar_jawa', String(Math.max(0, data.estimateLuarJawa))));
    if (data.providers !== undefined) {
      const providers = data.providers.map((v) => v.trim().toLowerCase()).filter(Boolean).slice(0, 10);
      updates.push(this.setSetting('shipping_providers', providers.join(',')));
    }
    if (data.originCityId !== undefined) updates.push(this.setSetting('shipping_origin_city_id', String(Math.max(1, data.originCityId))));
    if (data.defaultWeightGram !== undefined) updates.push(this.setSetting('shipping_default_weight_gram', String(Math.max(1, data.defaultWeightGram))));

    if (updates.length > 0) await Promise.all(updates);
    return this.getShippingSettings();
  }

  async setHomepageFeaturedSettings(data: { manualSlugs?: string[]; maxItems?: number }) {
    const updates: Promise<any>[] = [];

    if (data.manualSlugs !== undefined) {
      const clean = data.manualSlugs
        .map((slug) => slug.trim())
        .filter(Boolean)
        .slice(0, 100);
      updates.push(this.setSetting('homepage_featured_manual_slugs', clean.join(',')));
    }

    if (data.maxItems !== undefined) {
      const safeMaxItems = Math.min(50, Math.max(1, data.maxItems));
      updates.push(this.setSetting('homepage_featured_max_items', String(safeMaxItems)));
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return this.getHomepageFeaturedSettings();
  }

  async setWeeklyDealSettings(data: {
    title?: string;
    subtitle?: string;
    enabled?: boolean;
    discount?: number;
    endDate?: string;
    selectedProductIds?: string[];
    discountType?: 'percentage' | 'amount';
    discountValue?: number;
  }) {
    const updates: Promise<any>[] = [];

    if (data.title !== undefined) {
      updates.push(this.setSetting('weekly_deal_title', data.title));
    }
    if (data.subtitle !== undefined) {
      updates.push(this.setSetting('weekly_deal_subtitle', data.subtitle));
    }
    if (data.enabled !== undefined) {
      updates.push(this.setSetting('weekly_deal_enabled', String(data.enabled)));
    }
    if (data.discount !== undefined) {
      updates.push(this.setSetting('weekly_deal_discount', String(data.discount)));
    }
    if (data.endDate !== undefined) {
      updates.push(this.setSetting('weekly_deal_end_date', data.endDate));
    }

    if (data.selectedProductIds !== undefined) {
      const selectedProductIds = data.selectedProductIds
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100);
      updates.push(this.setSetting('weekly_deal_selected_product_ids', selectedProductIds.join(',')));
    }

    if (data.discountType !== undefined) {
      const safeDiscountType = data.discountType === 'amount' ? 'amount' : 'percentage';
      updates.push(this.setSetting('weekly_deal_discount_type', safeDiscountType));
    }

    if (data.discountValue !== undefined) {
      updates.push(this.setSetting('weekly_deal_discount_value', String(Math.max(0, Math.round(data.discountValue)))));
    }

    await Promise.all(updates);
    return this.getWeeklyDealSettings();
  }

  async getGeneralSettings() {
    const defaults = {
      storeName: 'Tumbas',
      storeEmail: 'admin@tumbas.id',
      storePhone: '',
      storeAddress: '',
    };

    const keys = ['general_store_name', 'general_store_email', 'general_store_phone', 'general_store_address'];
    const settings = await this.prisma.siteSettings.findMany({ where: { key: { in: keys } } });
    const result = { ...defaults };

    settings.forEach((setting) => {
      if (setting.key === 'general_store_name') result.storeName = setting.value;
      if (setting.key === 'general_store_email') result.storeEmail = setting.value;
      if (setting.key === 'general_store_phone') result.storePhone = setting.value;
      if (setting.key === 'general_store_address') result.storeAddress = setting.value;
    });

    return result;
  }

  async setGeneralSettings(data: {
    storeName?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
  }) {
    const updates: Promise<any>[] = [];
    if (data.storeName !== undefined) updates.push(this.setSetting('general_store_name', data.storeName));
    if (data.storeEmail !== undefined) updates.push(this.setSetting('general_store_email', data.storeEmail));
    if (data.storePhone !== undefined) updates.push(this.setSetting('general_store_phone', data.storePhone));
    if (data.storeAddress !== undefined) updates.push(this.setSetting('general_store_address', data.storeAddress));
    if (updates.length > 0) await Promise.all(updates);
    return this.getGeneralSettings();
  }

  async getStoreSettings() {
    const defaults = {
      currency: 'IDR',
      taxRate: 11,
    };

    const keys = ['store_currency', 'store_tax_rate'];
    const settings = await this.prisma.siteSettings.findMany({ where: { key: { in: keys } } });
    const result = { ...defaults };

    settings.forEach((setting) => {
      if (setting.key === 'store_currency') result.currency = setting.value || defaults.currency;
      if (setting.key === 'store_tax_rate') result.taxRate = parseInt(setting.value, 10) || defaults.taxRate;
    });

    return result;
  }

  async setStoreSettings(data: { currency?: string; taxRate?: number }) {
    const updates: Promise<any>[] = [];
    if (data.currency !== undefined) updates.push(this.setSetting('store_currency', data.currency));
    if (data.taxRate !== undefined) updates.push(this.setSetting('store_tax_rate', String(Math.max(0, data.taxRate))));
    if (updates.length > 0) await Promise.all(updates);
    return this.getStoreSettings();
  }

  async getProductCategories() {
    const defaults = [
      'Smartphone',
      'Laptop',
      'Tablet',
      'Headphones',
      'Smartwatch',
      'Camera',
      'Accessories',
      'Other',
    ];

    const raw = await this.getSetting('product_categories');
    if (!raw) return { categories: defaults };

    const categories = raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
      .slice(0, 100);

    return { categories: categories.length > 0 ? categories : defaults };
  }

  async setProductCategories(data: { categories?: string[] }) {
    if (!Array.isArray(data.categories)) {
      return this.getProductCategories();
    }

    const cleaned = data.categories
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
      .slice(0, 100);

    await this.setSetting('product_categories', cleaned.join(','));
    return this.getProductCategories();
  }

  async getNotificationSettings() {
    const defaults = {
      emailNotifications: true,
      orderNotifications: true,
      marketingEmails: false,
    };

    const keys = ['notif_email', 'notif_order', 'notif_marketing'];
    const settings = await this.prisma.siteSettings.findMany({ where: { key: { in: keys } } });
    const result = { ...defaults };

    settings.forEach((setting) => {
      if (setting.key === 'notif_email') result.emailNotifications = setting.value === 'true';
      if (setting.key === 'notif_order') result.orderNotifications = setting.value === 'true';
      if (setting.key === 'notif_marketing') result.marketingEmails = setting.value === 'true';
    });

    return result;
  }

  async setNotificationSettings(data: {
    emailNotifications?: boolean;
    orderNotifications?: boolean;
    marketingEmails?: boolean;
  }) {
    const updates: Promise<any>[] = [];
    if (data.emailNotifications !== undefined) updates.push(this.setSetting('notif_email', String(data.emailNotifications)));
    if (data.orderNotifications !== undefined) updates.push(this.setSetting('notif_order', String(data.orderNotifications)));
    if (data.marketingEmails !== undefined) updates.push(this.setSetting('notif_marketing', String(data.marketingEmails)));
    if (updates.length > 0) await Promise.all(updates);
    return this.getNotificationSettings();
  }

  async getAdminNoticeSettings() {
    const defaults = {
      enabled: false,
      title: 'Info Admin',
      message: '',
    };

    const keys = ['admin_notice_enabled', 'admin_notice_title', 'admin_notice_message'];
    const settings = await this.prisma.siteSettings.findMany({ where: { key: { in: keys } } });
    const result = { ...defaults };

    settings.forEach((setting) => {
      if (setting.key === 'admin_notice_enabled') result.enabled = setting.value === 'true';
      if (setting.key === 'admin_notice_title') result.title = setting.value;
      if (setting.key === 'admin_notice_message') result.message = setting.value;
    });

    return result;
  }

  async setAdminNoticeSettings(data: { enabled?: boolean; title?: string; message?: string }) {
    const updates: Promise<any>[] = [];
    if (data.enabled !== undefined) updates.push(this.setSetting('admin_notice_enabled', String(data.enabled)));
    if (data.title !== undefined) updates.push(this.setSetting('admin_notice_title', data.title));
    if (data.message !== undefined) updates.push(this.setSetting('admin_notice_message', data.message));
    if (updates.length > 0) await Promise.all(updates);
    return this.getAdminNoticeSettings();
  }

  async getShopHeroSettings() {
    const defaults = {
      badge: 'Koleksi Baru',
      title: 'Koleksi Musim Panas Telah Tiba',
      subtitle: 'Temukan tren aksesori terbaru dan nikmati diskon 20% untuk waktu terbatas.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeedSfej9dHlWKKsEZrhnlgVKTEkuxcUJvEzvKBxFq0eerDfw-ZXQB--pIyO00S4U6EsuEStAMeBYMujBGYj5a8NUIBX8F-xqLlP_t3ysmOc2fNeVmNWAF9M4HnK03c8vrHpEOhGq6msw8XUNw3adG5-hLCWYHKP3S73bgLRh7UrWbw-c2zYMc6cYtYpUtwPLpjwMCCx2wME-RA0k33V5x1yunQWF0EHev5_L1B8VU-ZxlAv8LTF_cGOp2XObWtgk9J900RRsTef4',
      ctaText: 'Belanja Sekarang',
    };

    const keys = ['shop_hero_badge', 'shop_hero_title', 'shop_hero_subtitle', 'shop_hero_image', 'shop_hero_cta_text'];
    const settings = await this.prisma.siteSettings.findMany({ where: { key: { in: keys } } });
    const result = { ...defaults };

    settings.forEach((setting) => {
      if (setting.key === 'shop_hero_badge') result.badge = setting.value;
      if (setting.key === 'shop_hero_title') result.title = setting.value;
      if (setting.key === 'shop_hero_subtitle') result.subtitle = setting.value;
      if (setting.key === 'shop_hero_image') result.image = setting.value;
      if (setting.key === 'shop_hero_cta_text') result.ctaText = setting.value;
    });

    return result;
  }

  async setShopHeroSettings(data: { badge?: string; title?: string; subtitle?: string; image?: string; ctaText?: string }) {
    const updates: Promise<any>[] = [];
    if (data.badge !== undefined) updates.push(this.setSetting('shop_hero_badge', data.badge));
    if (data.title !== undefined) updates.push(this.setSetting('shop_hero_title', data.title));
    if (data.subtitle !== undefined) updates.push(this.setSetting('shop_hero_subtitle', data.subtitle));
    if (data.image !== undefined) updates.push(this.setSetting('shop_hero_image', data.image));
    if (data.ctaText !== undefined) updates.push(this.setSetting('shop_hero_cta_text', data.ctaText));
    if (updates.length > 0) await Promise.all(updates);
    return this.getShopHeroSettings();
  }
}
