import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSetting(key: string): Promise<string | undefined>;
    setSetting(key: string, value: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    getAllSettings(): Promise<Record<string, string>>;
    setSettings(data: object): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
    getPromoSettings(): Promise<{
        heroImage: string;
        heroTitle: string;
        heroSubtitle: string;
        heroBadge: string;
        discountText: string;
    }>;
    getWeeklyDealSettings(): Promise<Record<string, any>>;
    getHomepageFeaturedSettings(): Promise<{
        manualSlugs: string[];
        maxItems: number;
    }>;
    setHomepageFeaturedSettings(data: {
        manualSlugs?: string[];
        maxItems?: number;
    }): Promise<{
        manualSlugs: string[];
        maxItems: number;
    }>;
    setWeeklyDealSettings(data: {
        title?: string;
        subtitle?: string;
        enabled?: boolean;
        discount?: number;
        endDate?: string;
    }): Promise<Record<string, any>>;
}
