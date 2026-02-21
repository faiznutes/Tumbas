import { SettingsService } from './settings.service';
declare class UpdatePromoSettingsDto {
    heroImage?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroBadge?: string;
    discountText?: string;
}
declare class UpdateWeeklyDealSettingsDto {
    title?: string;
    subtitle?: string;
    enabled?: boolean;
    discount?: number;
    endDate?: string;
}
declare class UpdateHomepageFeaturedSettingsDto {
    manualSlugs?: string[];
    maxItems?: number;
}
declare class UpdatePaymentSettingsDto {
    midtransEnabled?: boolean;
    midtransClientKey?: string;
    midtransServerKey?: string;
    midtransIsProduction?: boolean;
}
declare class UpdateShippingSettingsDto {
    minFreeShipping?: number;
    estimateJawa?: number;
    estimateLuarJawa?: number;
    providers?: string[];
    originCityId?: number;
    defaultWeightGram?: number;
}
declare class UpdateGeneralSettingsDto {
    storeName?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
}
declare class UpdateStoreSettingsDto {
    currency?: string;
    taxRate?: number;
}
declare class UpdateNotificationSettingsDto {
    emailNotifications?: boolean;
    orderNotifications?: boolean;
    marketingEmails?: boolean;
}
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
    getPromoSettings(): Promise<{
        heroImage: string;
        heroTitle: string;
        heroSubtitle: string;
        heroBadge: string;
        discountText: string;
    }>;
    updatePromoSettings(data: UpdatePromoSettingsDto): Promise<{
        heroImage: string;
        heroTitle: string;
        heroSubtitle: string;
        heroBadge: string;
        discountText: string;
    }>;
    getWeeklyDealSettings(): Promise<Record<string, any>>;
    updateWeeklyDealSettings(data: UpdateWeeklyDealSettingsDto): Promise<Record<string, any>>;
    getHomepageFeaturedSettings(): Promise<{
        manualSlugs: string[];
        maxItems: number;
    }>;
    updateHomepageFeaturedSettings(data: UpdateHomepageFeaturedSettingsDto): Promise<{
        manualSlugs: string[];
        maxItems: number;
    }>;
    getPaymentSettings(): Promise<{
        midtransEnabled: boolean;
        midtransClientKey: string;
        midtransServerKey: string;
        midtransIsProduction: boolean;
    }>;
    getPublicPaymentSettings(): Promise<{
        midtransEnabled: boolean;
        midtransClientKey: string;
        midtransIsProduction: boolean;
    }>;
    updatePaymentSettings(data: UpdatePaymentSettingsDto): Promise<{
        midtransEnabled: boolean;
        midtransClientKey: string;
        midtransServerKey: string;
        midtransIsProduction: boolean;
    }>;
    getShippingSettings(): Promise<{
        minFreeShipping: number;
        estimateJawa: number;
        estimateLuarJawa: number;
        providers: string[];
        originCityId: number;
        defaultWeightGram: number;
    }>;
    updateShippingSettings(data: UpdateShippingSettingsDto): Promise<{
        minFreeShipping: number;
        estimateJawa: number;
        estimateLuarJawa: number;
        providers: string[];
        originCityId: number;
        defaultWeightGram: number;
    }>;
    getGeneralSettings(): Promise<{
        storeName: string;
        storeEmail: string;
        storePhone: string;
        storeAddress: string;
    }>;
    updateGeneralSettings(data: UpdateGeneralSettingsDto): Promise<{
        storeName: string;
        storeEmail: string;
        storePhone: string;
        storeAddress: string;
    }>;
    getStoreSettings(): Promise<{
        currency: string;
        taxRate: number;
    }>;
    updateStoreSettings(data: UpdateStoreSettingsDto): Promise<{
        currency: string;
        taxRate: number;
    }>;
    getNotificationSettings(): Promise<{
        emailNotifications: boolean;
        orderNotifications: boolean;
        marketingEmails: boolean;
    }>;
    updateNotificationSettings(data: UpdateNotificationSettingsDto): Promise<{
        emailNotifications: boolean;
        orderNotifications: boolean;
        marketingEmails: boolean;
    }>;
    getAllSettings(): Promise<Record<string, string>>;
}
export {};
