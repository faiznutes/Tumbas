import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrdersService } from './orders.service';
import { PaymentStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PaymentStatus,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      search,
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
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get(':id/public')
  async findPublicById(@Param('id') id: string, @Query('token') token?: string) {
    return this.ordersService.findPublicById(id, token);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post('shipping/bulk-confirm')
  async bulkMarkShippedToExpedition(@Body() dto: BulkMarkShippedDto) {
    return this.ordersService.bulkMarkShippedToExpedition(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/shipping/confirm')
  async markShippedToExpedition(@Param('id') id: string, @Body() dto: MarkShippedDto) {
    return this.ordersService.markShippedToExpedition(id, dto);
  }
}
