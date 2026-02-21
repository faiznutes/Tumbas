import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrdersService } from './orders.service';
import { PaymentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  selectedVariantKey?: string;

  @IsOptional()
  @IsString()
  selectedVariantLabel?: string;
}

class CreateOrderDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerPhone: string;

  @IsString()
  customerAddress: string;

  @IsString()
  customerCity: string;

  @IsString()
  customerPostalCode: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  shippingProvider?: string;

  @IsOptional()
  @IsString()
  shippingRegion?: string;

  @IsOptional()
  @IsString()
  shippingService?: string;

  @IsOptional()
  @IsString()
  shippingEtd?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  shippingWeightGram?: number;

  @IsOptional()
  @IsString()
  shippingDestinationCityId?: string;

  @IsOptional()
  @IsString()
  selectedVariantKey?: string;

  @IsOptional()
  @IsString()
  selectedVariantLabel?: string;
}

class VerifyReceiptQueryDto {
  @IsString()
  receiptNo: string;

  @IsString()
  verificationCode: string;
}

class VerifyResiQueryDto {
  @IsString()
  resi: string;
}

class SyncPaymentQueryDto {
  @IsString()
  token: string;
}

class MarkShippedDto {
  @IsString()
  expeditionResi: string;

  @IsOptional()
  @IsString()
  expeditionName?: string;
}

class BulkMarkShippedDto {
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @IsString()
  expeditionResi: string;

  @IsOptional()
  @IsString()
  expeditionName?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders.view')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PaymentStatus,
    @Query('search') search?: string,
    @Query('includeExpired') includeExpired?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      search,
      includeExpired: includeExpired === 'true' || includeExpired === '1',
    });
  }

  @Get('verify-receipt')
  async verifyReceipt(@Query() query: VerifyReceiptQueryDto) {
    return this.ordersService.verifyReceipt(query.receiptNo, query.verificationCode);
  }

  @Get('verify-resi')
  async verifyResi(@Query() query: VerifyResiQueryDto) {
    return this.ordersService.verifyByResi(query.resi);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders.view')
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get(':id/public')
  async findPublicById(@Param('id') id: string, @Query('token') token?: string) {
    return this.ordersService.findPublicById(id, token);
  }

  @Post(':id/sync-payment')
  async syncPaymentStatus(
    @Param('id') id: string,
    @Query() query: SyncPaymentQueryDto,
  ) {
    return this.ordersService.syncPaymentStatus(id, query.token);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders.edit')
  @Post('shipping/bulk-confirm')
  async bulkMarkShippedToExpedition(@Body() dto: BulkMarkShippedDto) {
    return this.ordersService.bulkMarkShippedToExpedition(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders.edit')
  @Post(':id/shipping/confirm')
  async markShippedToExpedition(@Param('id') id: string, @Body() dto: MarkShippedDto) {
    return this.ordersService.markShippedToExpedition(id, dto);
  }
}
