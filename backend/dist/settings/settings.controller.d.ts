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
    }>;
    updateShippingSettings(data: UpdateShippingSettingsDto): Promise<{
        minFreeShipping: number;
        estimateJawa: number;
        estimateLuarJawa: number;
        providers: string[];
    }>;
    getAllSettings(): Promise<Record<string, string>>;
}
export {};
