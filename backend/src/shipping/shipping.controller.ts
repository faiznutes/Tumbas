import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingService } from './shipping.service';

class SearchCitiesQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

class ShippingRatesDto {
  @IsString()
  destinationCityId: string;

  @IsString()
  courier: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  weightGram: number;

  @IsOptional()
  @IsString()
  originCityId?: string;
}

@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get('cities')
  async searchCities(@Query() query: SearchCitiesQueryDto) {
    return this.shippingService.searchCities(query.q, query.limit);
  }

  @Post('rates')
  async getRates(@Body() dto: ShippingRatesDto) {
    return this.shippingService.getRates(dto);
  }
}
