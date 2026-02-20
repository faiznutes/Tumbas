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
    getAllSettings(): Promise<Record<string, string>>;
}
export {};
