"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { page = 1, limit = 20, category, status, minPrice, maxPrice, sort = 'newest', search } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (category && category !== 'all') {
            where.category = category;
        }
        if (status) {
            where.status = status;
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = minPrice;
            if (maxPrice)
                where.price.lte = maxPrice;
        }
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }
        let orderBy = { createdAt: 'desc' };
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
    async findBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { position: 'asc' } },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async create(data) {
        const { images, ...productData } = data;
        const product = await this.prisma.product.create({
            data: {
                ...productData,
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
    async update(id, data) {
        const { images, ...productData } = data;
        if (images) {
            await this.prisma.productImage.deleteMany({ where: { productId: id } });
        }
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                ...productData,
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
    async delete(id) {
        await this.prisma.product.delete({ where: { id } });
        return { success: true };
    }
    async bulkAction(action, ids, data) {
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map