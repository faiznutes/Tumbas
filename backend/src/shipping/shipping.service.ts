import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

type RajaOngkirCity = {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
};

@Injectable()
export class ShippingService {
  private readonly cityEndpoint = 'https://rajaongkir.komerce.id/api/v1/destination/domestic-destination';
  private cityCache = new Map<string, RajaOngkirCity>();

  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  private getApiKey() {
    const key = this.configService.get<string>('RAJAONGKIR_API_KEY') || '';
    if (!key.trim()) {
      throw new ServiceUnavailableException('RajaOngkir API key belum dikonfigurasi');
    }
    return key.trim();
  }

  private async fetchCities(query: string, limit: number) {
    const response = await fetch(`${this.cityEndpoint}?search=${encodeURIComponent(query)}&limit=${limit}&offset=0`, {
      headers: {
        key: this.getApiKey(),
      },
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Gagal mengambil data kota RajaOngkir');
    }

    const payload = await response.json() as {
      data?: RajaOngkirCity[];
      meta?: {
        status?: string;
      };
    };

    const cities = payload?.data || [];
    for (const city of cities) {
      this.cityCache.set(String(city.id), city);
    }

    return cities;
  }

  async searchCities(query: string, limit = 20) {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];

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

  async getRates(params: {
    destinationCityId: string;
    courier: string;
    weightGram: number;
    originCityId?: string;
  }) {
    const shippingSettings = await this.settingsService.getShippingSettings();
    const originCityId = params.originCityId || String(shippingSettings.originCityId || '444');
    const rawCourier = params.courier.trim().toLowerCase();
    const courierAliases: Record<string, 'jne' | 'jnt' | 'sicepat'> = {
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
      throw new BadRequestException('Kurir tidak didukung');
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
    const courierMultiplier: Record<string, number> = {
      jne: 1,
      jnt: 1.08,
      sicepat: 1.05,
    };

    const services: Array<{
      courier: string;
      service: string;
      description: string;
      cost: number;
      etd: string;
    }> = [];

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
}
