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
    baseUrl = 'https://api.rajaongkir.com/starter';
    cityCache = null;
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
    async fetchCities() {
        const now = Date.now();
        if (this.cityCache && now - this.cityCache.loadedAt < 1000 * 60 * 30) {
            return this.cityCache.cities;
        }
        const response = await fetch(`${this.baseUrl}/city`, {
            headers: {
                key: this.getApiKey(),
            },
        });
        if (!response.ok) {
            throw new common_1.ServiceUnavailableException('Gagal mengambil data kota RajaOngkir');
        }
        const payload = await response.json();
        const cities = payload?.rajaongkir?.results || [];
        this.cityCache = {
            loadedAt: now,
            cities,
        };
        return cities;
    }
    async searchCities(query, limit = 20) {
        const trimmed = query.trim().toLowerCase();
        if (trimmed.length < 2)
            return [];
        const cities = await this.fetchCities();
        return cities
            .filter((city) => {
            const full = `${city.type} ${city.city_name} ${city.province} ${city.postal_code}`.toLowerCase();
            return full.includes(trimmed);
        })
            .slice(0, Math.min(50, Math.max(1, limit)))
            .map((city) => ({
            cityId: city.city_id,
            provinceId: city.province_id,
            cityName: city.city_name,
            type: city.type,
            province: city.province,
            postalCode: city.postal_code,
            label: `${city.type} ${city.city_name}, ${city.province}`,
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
        const fallbackByCourier = {
            jne: 'jne',
            jnt: 'jne',
            sicepat: 'jne',
        };
        const requestBody = new URLSearchParams({
            origin: originCityId,
            destination: params.destinationCityId,
            weight: String(Math.max(1, Math.floor(params.weightGram))),
            courier: fallbackByCourier[courier],
        });
        const response = await fetch(`${this.baseUrl}/cost`, {
            method: 'POST',
            headers: {
                key: this.getApiKey(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody.toString(),
        });
        if (!response.ok) {
            throw new common_1.ServiceUnavailableException('Gagal menghitung ongkir dari RajaOngkir');
        }
        const payload = await response.json();
        const result = payload?.rajaongkir?.results?.[0];
        const services = [];
        for (const service of result?.costs || []) {
            const firstCost = service.cost?.[0];
            if (!firstCost)
                continue;
            services.push({
                courier,
                service: service.service,
                description: service.description,
                cost: firstCost.value,
                etd: firstCost.etd,
            });
        }
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