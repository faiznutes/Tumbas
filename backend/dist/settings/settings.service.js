"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSetting(key) {
        const setting = await this.prisma.siteSettings.findUnique({
            where: { key },
        });
        return setting?.value;
    }
    async setSetting(key, value) {
        return this.prisma.siteSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
    async getAllSettings() {
        const settings = await this.prisma.siteSettings.findMany();
        const result = {};
        settings.forEach(s => {
            result[s.key] = s.value;
        });
        return result;
    }
    async setSettings(data) {
        const updates = Object.entries(data)
            .filter(([, value]) => typeof value === 'string')
            .map(([key, value]) => this.setSetting(key, value));
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
        const result = { ...defaults };
        weeklyDealSettings.forEach(s => {
            if (s.key === 'weekly_deal_enabled') {
                result.enabled = s.value === 'true';
            }
            else if (s.key === 'weekly_deal_discount') {
                result.discount = parseInt(s.value) || 20;
            }
            else {
                const key = s.key.replace('weekly_deal_', '');
                result[key] = s.value;
            }
        });
        return result;
    }
    async getHomepageFeaturedSettings() {
        const defaults = {
            manualSlugs: [],
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
            if (setting.key === 'payment_midtrans_enabled')
                result.midtransEnabled = setting.value === 'true';
            if (setting.key === 'payment_midtrans_client_key')
                result.midtransClientKey = setting.value;
            if (setting.key === 'payment_midtrans_server_key')
                result.midtransServerKey = setting.value;
            if (setting.key === 'payment_midtrans_is_production')
                result.midtransIsProduction = setting.value === 'true';
        });
        return result;
    }
    async setPaymentSettings(data) {
        const updates = [];
        if (data.midtransEnabled !== undefined)
            updates.push(this.setSetting('payment_midtrans_enabled', String(data.midtransEnabled)));
        if (data.midtransClientKey !== undefined)
            updates.push(this.setSetting('payment_midtrans_client_key', data.midtransClientKey));
        if (data.midtransServerKey !== undefined)
            updates.push(this.setSetting('payment_midtrans_server_key', data.midtransServerKey));
        if (data.midtransIsProduction !== undefined)
            updates.push(this.setSetting('payment_midtrans_is_production', String(data.midtransIsProduction)));
        if (updates.length > 0)
            await Promise.all(updates);
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
            if (setting.key === 'shipping_min_free')
                result.minFreeShipping = parseInt(setting.value, 10) || defaults.minFreeShipping;
            if (setting.key === 'shipping_estimate_jawa')
                result.estimateJawa = parseInt(setting.value, 10) || defaults.estimateJawa;
            if (setting.key === 'shipping_estimate_luar_jawa')
                result.estimateLuarJawa = parseInt(setting.value, 10) || defaults.estimateLuarJawa;
            if (setting.key === 'shipping_providers') {
                result.providers = setting.value.split(',').map((v) => v.trim()).filter(Boolean);
            }
            if (setting.key === 'shipping_origin_city_id')
                result.originCityId = parseInt(setting.value, 10) || defaults.originCityId;
            if (setting.key === 'shipping_default_weight_gram')
                result.defaultWeightGram = parseInt(setting.value, 10) || defaults.defaultWeightGram;
        });
        return result;
    }
    async setShippingSettings(data) {
        const updates = [];
        if (data.minFreeShipping !== undefined)
            updates.push(this.setSetting('shipping_min_free', String(Math.max(0, data.minFreeShipping))));
        if (data.estimateJawa !== undefined)
            updates.push(this.setSetting('shipping_estimate_jawa', String(Math.max(0, data.estimateJawa))));
        if (data.estimateLuarJawa !== undefined)
            updates.push(this.setSetting('shipping_estimate_luar_jawa', String(Math.max(0, data.estimateLuarJawa))));
        if (data.providers !== undefined) {
            const providers = data.providers.map((v) => v.trim().toLowerCase()).filter(Boolean).slice(0, 10);
            updates.push(this.setSetting('shipping_providers', providers.join(',')));
        }
        if (data.originCityId !== undefined)
            updates.push(this.setSetting('shipping_origin_city_id', String(Math.max(1, data.originCityId))));
        if (data.defaultWeightGram !== undefined)
            updates.push(this.setSetting('shipping_default_weight_gram', String(Math.max(1, data.defaultWeightGram))));
        if (updates.length > 0)
            await Promise.all(updates);
        return this.getShippingSettings();
    }
    async setHomepageFeaturedSettings(data) {
        const updates = [];
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
    async setWeeklyDealSettings(data) {
        const updates = [];
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
            if (setting.key === 'general_store_name')
                result.storeName = setting.value;
            if (setting.key === 'general_store_email')
                result.storeEmail = setting.value;
            if (setting.key === 'general_store_phone')
                result.storePhone = setting.value;
            if (setting.key === 'general_store_address')
                result.storeAddress = setting.value;
        });
        return result;
    }
    async setGeneralSettings(data) {
        const updates = [];
        if (data.storeName !== undefined)
            updates.push(this.setSetting('general_store_name', data.storeName));
        if (data.storeEmail !== undefined)
            updates.push(this.setSetting('general_store_email', data.storeEmail));
        if (data.storePhone !== undefined)
            updates.push(this.setSetting('general_store_phone', data.storePhone));
        if (data.storeAddress !== undefined)
            updates.push(this.setSetting('general_store_address', data.storeAddress));
        if (updates.length > 0)
            await Promise.all(updates);
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
            if (setting.key === 'store_currency')
                result.currency = setting.value || defaults.currency;
            if (setting.key === 'store_tax_rate')
                result.taxRate = parseInt(setting.value, 10) || defaults.taxRate;
        });
        return result;
    }
    async setStoreSettings(data) {
        const updates = [];
        if (data.currency !== undefined)
            updates.push(this.setSetting('store_currency', data.currency));
        if (data.taxRate !== undefined)
            updates.push(this.setSetting('store_tax_rate', String(Math.max(0, data.taxRate))));
        if (updates.length > 0)
            await Promise.all(updates);
        return this.getStoreSettings();
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
            if (setting.key === 'notif_email')
                result.emailNotifications = setting.value === 'true';
            if (setting.key === 'notif_order')
                result.orderNotifications = setting.value === 'true';
            if (setting.key === 'notif_marketing')
                result.marketingEmails = setting.value === 'true';
        });
        return result;
    }
    async setNotificationSettings(data) {
        const updates = [];
        if (data.emailNotifications !== undefined)
            updates.push(this.setSetting('notif_email', String(data.emailNotifications)));
        if (data.orderNotifications !== undefined)
            updates.push(this.setSetting('notif_order', String(data.orderNotifications)));
        if (data.marketingEmails !== undefined)
            updates.push(this.setSetting('notif_marketing', String(data.marketingEmails)));
        if (updates.length > 0)
            await Promise.all(updates);
        return this.getNotificationSettings();
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map