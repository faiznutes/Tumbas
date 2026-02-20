import { ProductsService } from './products.service';
import { ProductStatus } from '@prisma/client';
declare class CreateProductDto {
    title: string;
    slug: string;
    description?: string;
    price: number;
    stock?: number;
    category?: string;
    images?: {
        url: string;
        position?: number;
    }[];
}
declare class UpdateProductDto {
    title?: string;
    slug?: string;
    description?: string;
    price?: number;
    stock?: number;
    status?: ProductStatus;
    category?: string;
    images?: {
        url: string;
        position?: number;
    }[];
}
declare class BulkActionDto {
    action: 'DELETE' | 'MARK_SOLD' | 'CHANGE_STATUS';
    ids: string[];
    status?: ProductStatus;
}
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    findAll(page?: string, limit?: string, category?: string, status?: ProductStatus, minPrice?: string, maxPrice?: string, sort?: string, search?: string): Promise<{
        data: ({
            images: {
                id: string;
                createdAt: Date;
                position: number;
                productId: string;
                url: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            status: import("@prisma/client").$Enums.ProductStatus;
            description: string | null;
            title: string;
            slug: string;
            price: number;
            stock: number;
            createdById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findBySlug(slug: string): Promise<{
        images: {
            id: string;
            createdAt: Date;
            position: number;
            productId: string;
            url: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        status: import("@prisma/client").$Enums.ProductStatus;
        description: string | null;
        title: string;
        slug: string;
        price: number;
        stock: number;
        createdById: string | null;
    }>;
    create(dto: CreateProductDto): Promise<{
        images: {
            id: string;
            createdAt: Date;
            position: number;
            productId: string;
            url: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        status: import("@prisma/client").$Enums.ProductStatus;
        description: string | null;
        title: string;
        slug: string;
        price: number;
        stock: number;
        createdById: string | null;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        images: {
            id: string;
            createdAt: Date;
            position: number;
            productId: string;
            url: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        status: import("@prisma/client").$Enums.ProductStatus;
        description: string | null;
        title: string;
        slug: string;
        price: number;
        stock: number;
        createdById: string | null;
    }>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    bulkAction(dto: BulkActionDto): Promise<{
        success: boolean;
    }>;
}
export {};
