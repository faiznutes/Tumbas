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
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const settings_service_1 = require("../settings/settings.service");
let ShippingService = class ShippingService {
    configService;
    settingsService;
    cityEndpoint = 'https://rajaongkir.komerce.id/api/v1/destination/domestic-destination';
    cityCache = new Map();
    constructor(configService, settingsService) {
        this.configService = configService;
        this.settingsService = settingsService;
    }
    getApiKey() {
        const key = this.configService.get('RAJAONGKIR_API_KEY') || '';
        if (!key.trim()) {
            throw new common_1.ServiceUnavailableException('RajaOngkir API key belum dikonfigurasi');
        }
        return key.trim();
    }
    async fetchCities(query, limit) {
        const response = await fetch(`${this.cityEndpoint}?search=${encodeURIComponent(query)}&limit=${limit}&offset=0`, {
            headers: {
                key: this.getApiKey(),
            },
        });
        if (!response.ok) {
            throw new common_1.ServiceUnavailableException('Gagal mengambil data kota RajaOngkir');
        }
        const payload = await response.json();
        const cities = payload?.data || [];
        for (const city of cities) {
            this.cityCache.set(String(city.id), city);
        }
        return cities;
    }
    async searchCities(query, limit = 20) {
        const trimmed = query.trim().toLowerCase();
        if (trimmed.length < 2)
            return [];
        const cities = await this.fetchCities(trimmed, Math.min(50, Math.max(1, limit)));
        return cities
            .map((city) => ({
            cityId: String(city.id),
            provinceId: city.province_name,
            cityName: city.city_name,
            type: city.district_name || city.subdistrict_name || 'Kota',
            province: city.province_name,
            postalCode: city.zip_code,
            label: city.label,
        }));
    }
    async getRates(params) {
        const shippingSettings = await this.settingsService.getShippingSettings();
        const originCityId = params.originCityId || String(shippingSettings.originCityId || '444');
        const rawCourier = params.courier.trim().toLowerCase();
        const courierAliases = {
            jne: 'jne',
            'j&t': 'jnt',
            'j&t express': 'jnt',
            jnt: 'jnt',
            'jnt express': 'jnt',
            sicepat: 'sicepat',
            'si cepat': 'sicepat',
        };
        const courier = courierAliases[rawCourier] || rawCourier;
        if (!['jne', 'jnt', 'sicepat'].includes(courier)) {
            throw new common_1.BadRequestException('Kurir tidak didukung');
        }
        const destination = this.cityCache.get(params.destinationCityId);
        const jawaProvinces = new Set([
            'DKI JAKARTA',
            'JAWA BARAT',
            'JAWA TENGAH',
            'DI YOGYAKARTA',
            'JAWA TIMUR',
            'BANTEN',
        ]);
        const destinationProvince = (destination?.province_name || '').toUpperCase();
        const isJawa = jawaProvinces.has(destinationProvince);
        const baseCost = isJawa ? shippingSettings.estimateJawa : shippingSettings.estimateLuarJawa;
        const courierMultiplier = {
            jne: 1,
            jnt: 1.08,
            sicepat: 1.05,
        };
        const services = [];
        const multiplier = courierMultiplier[courier] || 1;
        const weightFactor = Math.max(1, Math.ceil(params.weightGram / 1000));
        const regularCost = Math.round(baseCost * multiplier * weightFactor);
        services.push({
            courier,
            service: 'REG',
            description: `Estimasi ${courier.toUpperCase()} reguler`,
            cost: regularCost,
            etd: isJawa ? '1-3' : '3-7',
        });
        services.push({
            courier,
            service: 'YES',
            description: `Estimasi ${courier.toUpperCase()} cepat`,
            cost: Math.round(regularCost * 1.35),
            etd: isJawa ? '1-2' : '2-4',
        });
        return {
            originCityId,
            destinationCityId: params.destinationCityId,
            courier,
            weightGram: Math.max(1, Math.floor(params.weightGram)),
            services,
        };
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        settings_service_1.SettingsService])
], ShippingService);
//# sourceMappingURL=shipping.service.js.map