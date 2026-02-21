import { ShippingService } from './shipping.service';
declare class SearchCitiesQueryDto {
    q: string;
    limit?: number;
}
declare class ShippingRatesDto {
    destinationCityId: string;
    courier: string;
    weightGram: number;
    originCityId?: string;
}
export declare class ShippingController {
    private shippingService;
    constructor(shippingService: ShippingService);
    searchCities(query: SearchCitiesQueryDto): Promise<{
        cityId: string;
        provinceId: string;
        cityName: string;
        type: string;
        province: string;
        postalCode: string;
        label: string;
    }[]>;
    getRates(dto: ShippingRatesDto): Promise<{
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
export {};
