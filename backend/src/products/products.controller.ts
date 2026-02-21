import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsString, IsNumber, IsOptional, IsArray, Min, IsEnum } from 'class-validator';
import { ProductsService } from './products.service';
import { ProductStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  images?: { url: string; position?: number }[];

  @IsOptional()
  variants?: unknown;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weightGram?: number;
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  images?: { url: string; position?: number }[];

  @IsOptional()
  variants?: unknown;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weightGram?: number;
}

class BulkActionDto {
  @IsEnum(['DELETE', 'MARK_SOLD', 'CHANGE_STATUS'])
  action: 'DELETE' | 'MARK_SOLD' | 'CHANGE_STATUS';

  @IsArray()
  ids: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('status') status?: ProductStatus,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      category,
      status,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      sort,
      search,
    });
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.edit')
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.edit')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.edit')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.edit')
  async bulkAction(@Body() dto: BulkActionDto) {
    return this.productsService.bulkAction(dto.action, dto.ids, { status: dto.status });
  }
}
