import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        page?: number;
        limit?: number;
        category?: string;
        status?: ProductStatus;
        minPrice?: number;
        maxPrice?: number;
        sort?: string;
        search?: string;
    }): Promise<{
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
    create(data: {
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
        createdById?: string;
    }): Promise<{
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
    update(id: string, data: {
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
    }): Promise<{
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
    bulkAction(action: 'DELETE' | 'MARK_SOLD' | 'CHANGE_STATUS', ids: string[], data?: {
        status?: ProductStatus;
        category?: string;
    }): Promise<{
        success: boolean;
    }>;
}
