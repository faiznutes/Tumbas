import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
export declare class ShippingService {
    private configService;
    private settingsService;
    private readonly baseUrl;
    private cityCache;
    constructor(configService: ConfigService, settingsService: SettingsService);
    private getApiKey;
    private fetchCities;
    searchCities(query: string, limit?: number): Promise<{
        cityId: string;
        provinceId: string;
        cityName: string;
        type: string;
        province: string;
        postalCode: string;
        label: string;
    }[]>;
    getRates(params: {
        destinationCityId: string;
        courier: string;
        weightGram: number;
        originCityId?: string;
    }): Promise<{
        originCityId: string;
        destinationCityId: string;
        courier: "jne" | "jnt" | "sicepat";
        weightGram: number;
        services: {
            courier: string;
            service: string;
            description: string;
            cost: number;
            etd: string;
        }[];
    }>;
}
