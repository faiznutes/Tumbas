import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: ProductStatus;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, category, status, minPrice, maxPrice, sort = 'newest', search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { orders: { _count: 'desc' } };
        break;
      case 'rating':
        orderBy = { title: 'asc' };
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { position: 'asc' } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(data: {
    title: string;
    slug: string;
    description?: string;
    price: number;
    stock?: number;
    category?: string;
    images?: { url: string; position?: number }[];
    variants?: unknown;
    weightGram?: number;
    createdById?: string;
  }) {
    const { images, ...productData } = data;
    
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        weightGram: data.weightGram ? Math.max(1, Math.round(data.weightGram)) : 1000,
        variants: this.normalizeVariants(data.variants),
        images: images ? {
          create: images.map((img, index) => ({
            url: img.url,
            position: img.position ?? index,
          })),
        } : undefined,
      },
      include: { images: true },
    });

    return product;
  }

  async update(id: string, data: {
    title?: string;
    slug?: string;
    description?: string;
    price?: number;
    stock?: number;
    status?: ProductStatus;
    category?: string;
    images?: { url: string; position?: number }[];
    variants?: unknown;
    weightGram?: number;
  }) {
    const { images, ...productData } = data;

    if (images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        weightGram: data.weightGram ? Math.max(1, Math.round(data.weightGram)) : undefined,
        variants: data.variants !== undefined ? this.normalizeVariants(data.variants) : undefined,
        images: images ? {
          create: images.map((img, index) => ({
            url: img.url,
            position: img.position ?? index,
          })),
        } : undefined,
      },
      include: { images: true },
    });

    return product;
  }

  async delete(id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async bulkAction(action: 'DELETE' | 'MARK_SOLD' | 'CHANGE_STATUS', ids: string[], data?: { status?: ProductStatus; category?: string }) {
    switch (action) {
      case 'DELETE':
        await this.prisma.product.deleteMany({ where: { id: { in: ids } } });
        break;
      case 'MARK_SOLD':
        await this.prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { status: 'SOLD' },
        });
        break;
      case 'CHANGE_STATUS':
        if (data?.status) {
          await this.prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { status: data.status },
          });
        }
        break;
    }
    return { success: true };
  }

  private normalizeVariants(input: unknown) {
    if (!Array.isArray(input)) return Prisma.JsonNull;
    const variants = input
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const item = row as Record<string, unknown>;
        const key = String(item.key || '').trim();
        const label = String(item.label || '').trim();
        if (!key || !label) return null;
        return {
          key,
          label,
          attribute1Name: String(item.attribute1Name || '').trim(),
          attribute1Value: String(item.attribute1Value || '').trim(),
          attribute2Name: String(item.attribute2Name || '').trim(),
          attribute2Value: String(item.attribute2Value || '').trim(),
          stock: Math.max(0, Number(item.stock || 0)),
          price: Math.max(0, Number(item.price || 0)),
          weightGram: Math.max(1, Number(item.weightGram || 1000)),
        };
      })
      .filter(Boolean);

    return variants.length > 0 ? (variants as Prisma.InputJsonValue) : Prisma.JsonNull;
  }
}
