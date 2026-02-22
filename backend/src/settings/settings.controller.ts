import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
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

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedProductIds?: string[];

  @IsOptional()
  @IsIn(['percentage', 'amount'])
  discountType?: 'percentage' | 'amount';

  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number;
}

class UpdateHomepageFeaturedSettingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  manualSlugs?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxItems?: number;
}

class UpdateShopHeroSettingsDto {
  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;
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

class UpdateProductCategoriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
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

class UpdateAdminNoticeSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('promo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.promo.view')
  async getPromoSettings() {
    return this.settingsService.getPromoSettings();
  }

  @Get('promo-public')
  async getPromoSettingsPublic() {
    return this.settingsService.getPromoSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.promo.edit')
  @Post('promo')
  async updatePromoSettings(@Body() data: UpdatePromoSettingsDto) {
    return this.settingsService.setPromoSettings(data);
  }

  @Get('weekly-deal')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.weekly.view')
  async getWeeklyDealSettings() {
    return this.settingsService.getWeeklyDealSettings();
  }

  @Get('weekly-deal-public')
  async getWeeklyDealSettingsPublic() {
    return this.settingsService.getWeeklyDealSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.weekly.edit')
  @Post('weekly-deal')
  async updateWeeklyDealSettings(@Body() data: UpdateWeeklyDealSettingsDto) {
    return this.settingsService.setWeeklyDealSettings({
      ...data,
      endDate: data.endDate ?? data.end_date,
    });
  }

  @Get('homepage-featured')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.featured.view')
  async getHomepageFeaturedSettings() {
    return this.settingsService.getHomepageFeaturedSettings();
  }

  @Get('homepage-featured-public')
  async getHomepageFeaturedSettingsPublic() {
    return this.settingsService.getHomepageFeaturedSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.featured.edit')
  @Post('homepage-featured')
  async updateHomepageFeaturedSettings(@Body() data: UpdateHomepageFeaturedSettingsDto) {
    return this.settingsService.setHomepageFeaturedSettings(data);
  }

  @Get('shop-hero')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.promo.view')
  async getShopHeroSettings() {
    return this.settingsService.getShopHeroSettings();
  }

  @Get('shop-hero-public')
  async getShopHeroSettingsPublic() {
    return this.settingsService.getShopHeroSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.promo.edit')
  @Post('shop-hero')
  async updateShopHeroSettings(@Body() data: UpdateShopHeroSettingsDto) {
    return this.settingsService.setShopHeroSettings(data);
  }

  @Get('payment')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.payment.view')
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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.payment.edit')
  @Post('payment')
  async updatePaymentSettings(@Body() data: UpdatePaymentSettingsDto) {
    return this.settingsService.setPaymentSettings(data);
  }

  @Get('shipping')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.shipping.view')
  async getShippingSettings() {
    return this.settingsService.getShippingSettings();
  }

  @Get('shipping-public')
  async getShippingSettingsPublic() {
    return this.settingsService.getShippingSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.shipping.edit')
  @Post('shipping')
  async updateShippingSettings(@Body() data: UpdateShippingSettingsDto) {
    return this.settingsService.setShippingSettings(data);
  }

  @Get('general')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.general.view')
  async getGeneralSettings() {
    return this.settingsService.getGeneralSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.general.edit')
  @Post('general')
  async updateGeneralSettings(@Body() data: UpdateGeneralSettingsDto) {
    return this.settingsService.setGeneralSettings(data);
  }

  @Get('store')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.store.view')
  async getStoreSettings() {
    return this.settingsService.getStoreSettings();
  }

  @Get('store-public')
  async getStoreSettingsPublic() {
    return this.settingsService.getStoreSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.store.edit')
  @Post('store')
  async updateStoreSettings(@Body() data: UpdateStoreSettingsDto) {
    return this.settingsService.setStoreSettings(data);
  }

  @Get('product-categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.edit')
  async getProductCategories() {
    return this.settingsService.getProductCategories();
  }

  @Get('product-categories-public')
  async getProductCategoriesPublic() {
    return this.settingsService.getProductCategories();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.edit')
  @Post('product-categories')
  async updateProductCategories(@Body() data: UpdateProductCategoriesDto) {
    return this.settingsService.setProductCategories(data);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.notifications.view')
  async getNotificationSettings() {
    return this.settingsService.getNotificationSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.notifications.edit')
  @Post('notifications')
  async updateNotificationSettings(@Body() data: UpdateNotificationSettingsDto) {
    return this.settingsService.setNotificationSettings(data);
  }

  @Get('admin-notice')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings.notice.view')
  async getAdminNoticeSettings() {
    return this.settingsService.getAdminNoticeSettings();
  }

  @Get('admin-notice-public')
  async getPublicAdminNoticeSettings() {
    const notice = await this.settingsService.getAdminNoticeSettings();
    return {
      enabled: notice.enabled,
      title: notice.title,
      message: notice.message,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('admin-notice')
  async updateAdminNoticeSettings(@Body() data: UpdateAdminNoticeSettingsDto) {
    return this.settingsService.setAdminNoticeSettings(data);
  }

  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }
}
