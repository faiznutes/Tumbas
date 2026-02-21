import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

type RajaOngkirCity = {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
};

type RajaOngkirCostService = {
  service: string;
  description: string;
  cost: Array<{
    value: number;
    etd: string;
    note: string;
  }>;
};

@Injectable()
export class ShippingService {
  private readonly baseUrl = 'https://api.rajaongkir.com/starter';
  private cityCache: { loadedAt: number; cities: RajaOngkirCity[] } | null = null;

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

  private async fetchCities() {
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
      throw new ServiceUnavailableException('Gagal mengambil data kota RajaOngkir');
    }

    const payload = await response.json() as {
      rajaongkir?: {
        results?: RajaOngkirCity[];
      };
    };

    const cities = payload?.rajaongkir?.results || [];
    this.cityCache = {
      loadedAt: now,
      cities,
    };
    return cities;
  }

  async searchCities(query: string, limit = 20) {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];

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

    const fallbackByCourier: Record<string, string> = {
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
      throw new ServiceUnavailableException('Gagal menghitung ongkir dari RajaOngkir');
    }

    const payload = await response.json() as {
      rajaongkir?: {
        results?: Array<{
          code: string;
          name: string;
          costs: RajaOngkirCostService[];
        }>;
      };
    };

    const result = payload?.rajaongkir?.results?.[0];
    const services: Array<{
      courier: string;
      service: string;
      description: string;
      cost: number;
      etd: string;
    }> = [];

    for (const service of result?.costs || []) {
      const firstCost = service.cost?.[0];
      if (!firstCost) continue;
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
}
