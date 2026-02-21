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
      heroTitle: 'Sale Musim Panas: Hasta 50% Off',
      heroSubtitle: 'Tingkatkan gaya hidup Anda dengan koleksi eksklusif kami. Dari teknologi tinggi hingga fashion premium.',
      heroBadge: 'Penawaran Terbatas',
      discountText: '50% Off',
    };
    
    const settings = await this.getAllSettings();
    return { ...defaults, ...settings };
  }

  async getWeeklyDealSettings() {
    const defaults = {
      title: 'Penawaran Mingguan',
      subtitle: 'Ambil ofertas especiais sebelum habis',
      enabled: true,
      discount: 20,
      endDate: '',
    };
    
    const weeklyDealKeys = ['weekly_deal_title', 'weekly_deal_subtitle', 'weekly_deal_enabled', 'weekly_deal_discount', 'weekly_deal_end_date'];
    const weeklyDealSettings = await this.prisma.siteSettings.findMany({
      where: { key: { in: weeklyDealKeys } },
    });
    
    const result: Record<string, any> = { ...defaults };
    weeklyDealSettings.forEach(s => {
      if (s.key === 'weekly_deal_enabled') {
        result.enabled = s.value === 'true';
      } else if (s.key === 'weekly_deal_discount') {
        result.discount = parseInt(s.value) || 20;
      } else {
        const key = s.key.replace('weekly_deal_', '');
        result[key] = s.value;
      }
    });
    
    return result;
  }

  async getHomepageFeaturedSettings() {
    const defaults = {
      manualSlugs: [] as string[],
      maxItems: 3,
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
        result.maxItems = Number.isFinite(parsed) ? Math.min(8, Math.max(1, parsed)) : defaults.maxItems;
      }
    });

    return result;
  }

  async getPaymentSettings() {
    const defaults = {
      midtransEnabled: true,
      midtransClientKey: '',
      midtransServerKey: '',
      midtransIsProduction: false,
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
        .slice(0, 8);
      updates.push(this.setSetting('homepage_featured_manual_slugs', clean.join(',')));
    }

    if (data.maxItems !== undefined) {
      const safeMaxItems = Math.min(8, Math.max(1, data.maxItems));
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
    
    await Promise.all(updates);
    return this.getWeeklyDealSettings();
  }
}
