import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class UpdatePromoSettingsDto {
  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @IsOptional()
  @IsString()
  heroBadge?: string;

  @IsOptional()
  @IsString()
  discountText?: string;
}

class UpdateWeeklyDealSettingsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsString()
  endDate?: string;
}

class UpdateHomepageFeaturedSettingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  manualSlugs?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  maxItems?: number;
}

class UpdatePaymentSettingsDto {
  @IsOptional()
  @IsBoolean()
  midtransEnabled?: boolean;

  @IsOptional()
  @IsString()
  midtransClientKey?: string;

  @IsOptional()
  @IsString()
  midtransServerKey?: string;

  @IsOptional()
  @IsBoolean()
  midtransIsProduction?: boolean;
}

class UpdateShippingSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minFreeShipping?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimateJawa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimateLuarJawa?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  providers?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  originCityId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultWeightGram?: number;
}

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('promo')
  async getPromoSettings() {
    return this.settingsService.getPromoSettings();
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post('promo')
  async updatePromoSettings(@Body() data: UpdatePromoSettingsDto) {
    await this.settingsService.setSettings(data);
    return this.settingsService.getPromoSettings();
  }

  @Get('weekly-deal')
  async getWeeklyDealSettings() {
    return this.settingsService.getWeeklyDealSettings();
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post('weekly-deal')
  async updateWeeklyDealSettings(@Body() data: UpdateWeeklyDealSettingsDto) {
    return this.settingsService.setWeeklyDealSettings(data);
  }

  @Get('homepage-featured')
  async getHomepageFeaturedSettings() {
    return this.settingsService.getHomepageFeaturedSettings();
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post('homepage-featured')
  async updateHomepageFeaturedSettings(@Body() data: UpdateHomepageFeaturedSettingsDto) {
    return this.settingsService.setHomepageFeaturedSettings(data);
  }

  @Get('payment')
  async getPaymentSettings() {
    return this.settingsService.getPaymentSettings();
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post('payment')
  async updatePaymentSettings(@Body() data: UpdatePaymentSettingsDto) {
    return this.settingsService.setPaymentSettings(data);
  }

  @Get('shipping')
  async getShippingSettings() {
    return this.settingsService.getShippingSettings();
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post('shipping')
  async updateShippingSettings(@Body() data: UpdateShippingSettingsDto) {
    return this.settingsService.setShippingSettings(data);
  }

  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }
}
