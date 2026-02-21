import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
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

class UpdateGeneralSettingsDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeEmail?: string;

  @IsOptional()
  @IsString()
  storePhone?: string;

  @IsOptional()
  @IsString()
  storeAddress?: string;
}

class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  taxRate?: number;
}

class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  orderNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;
}

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('promo')
  async getPromoSettings() {
    return this.settingsService.getPromoSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('promo')
  async updatePromoSettings(@Body() data: UpdatePromoSettingsDto) {
    return this.settingsService.setPromoSettings(data);
  }

  @Get('weekly-deal')
  async getWeeklyDealSettings() {
    return this.settingsService.getWeeklyDealSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('weekly-deal')
  async updateWeeklyDealSettings(@Body() data: UpdateWeeklyDealSettingsDto) {
    return this.settingsService.setWeeklyDealSettings(data);
  }

  @Get('homepage-featured')
  async getHomepageFeaturedSettings() {
    return this.settingsService.getHomepageFeaturedSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('homepage-featured')
  async updateHomepageFeaturedSettings(@Body() data: UpdateHomepageFeaturedSettingsDto) {
    return this.settingsService.setHomepageFeaturedSettings(data);
  }

  @Get('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async getPaymentSettings() {
    return this.settingsService.getPaymentSettings();
  }

  @Get('payment-public')
  async getPublicPaymentSettings() {
    const settings = await this.settingsService.getPaymentSettings();
    return {
      midtransEnabled: settings.midtransEnabled,
      midtransClientKey: settings.midtransClientKey,
      midtransIsProduction: settings.midtransIsProduction,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('payment')
  async updatePaymentSettings(@Body() data: UpdatePaymentSettingsDto) {
    return this.settingsService.setPaymentSettings(data);
  }

  @Get('shipping')
  async getShippingSettings() {
    return this.settingsService.getShippingSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('shipping')
  async updateShippingSettings(@Body() data: UpdateShippingSettingsDto) {
    return this.settingsService.setShippingSettings(data);
  }

  @Get('general')
  async getGeneralSettings() {
    return this.settingsService.getGeneralSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('general')
  async updateGeneralSettings(@Body() data: UpdateGeneralSettingsDto) {
    return this.settingsService.setGeneralSettings(data);
  }

  @Get('store')
  async getStoreSettings() {
    return this.settingsService.getStoreSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('store')
  async updateStoreSettings(@Body() data: UpdateStoreSettingsDto) {
    return this.settingsService.setStoreSettings(data);
  }

  @Get('notifications')
  async getNotificationSettings() {
    return this.settingsService.getNotificationSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @Post('notifications')
  async updateNotificationSettings(@Body() data: UpdateNotificationSettingsDto) {
    return this.settingsService.setNotificationSettings(data);
  }

  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }
}
