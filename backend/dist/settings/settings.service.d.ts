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
    getPaymentSettings(): Promise<{
        midtransEnabled: boolean;
        midtransClientKey: string;
        midtransServerKey: string;
        midtransIsProduction: boolean;
    }>;
    setPaymentSettings(data: {
        midtransEnabled?: boolean;
        midtransClientKey?: string;
        midtransServerKey?: string;
        midtransIsProduction?: boolean;
    }): Promise<{
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
    setShippingSettings(data: {
        minFreeShipping?: number;
        estimateJawa?: number;
        estimateLuarJawa?: number;
        providers?: string[];
        originCityId?: number;
        defaultWeightGram?: number;
    }): Promise<{
        minFreeShipping: number;
        estimateJawa: number;
        estimateLuarJawa: number;
        providers: string[];
        originCityId: number;
        defaultWeightGram: number;
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
    getGeneralSettings(): Promise<{
        storeName: string;
        storeEmail: string;
        storePhone: string;
        storeAddress: string;
    }>;
    setGeneralSettings(data: {
        storeName?: string;
        storeEmail?: string;
        storePhone?: string;
        storeAddress?: string;
    }): Promise<{
        storeName: string;
        storeEmail: string;
        storePhone: string;
        storeAddress: string;
    }>;
    getStoreSettings(): Promise<{
        currency: string;
        taxRate: number;
    }>;
    setStoreSettings(data: {
        currency?: string;
        taxRate?: number;
    }): Promise<{
        currency: string;
        taxRate: number;
    }>;
    getNotificationSettings(): Promise<{
        emailNotifications: boolean;
        orderNotifications: boolean;
        marketingEmails: boolean;
    }>;
    setNotificationSettings(data: {
        emailNotifications?: boolean;
        orderNotifications?: boolean;
        marketingEmails?: boolean;
    }): Promise<{
        emailNotifications: boolean;
        orderNotifications: boolean;
        marketingEmails: boolean;
    }>;
}
