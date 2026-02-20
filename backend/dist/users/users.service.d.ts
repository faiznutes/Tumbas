import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
    }): Promise<{
        data: {
            id: string;
            email: string;
            name: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            permissions: string;
            isActive: boolean;
            createdAt: Date;
            _count: {
                products: number;
                orders: number;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        _count: {
            products: number;
            orders: number;
        };
    }>;
    create(data: {
        email: string;
        password: string;
        name?: string;
        role?: UserRole;
        permissions?: string[];
    }): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
        role?: UserRole;
        permissions?: string[];
        isActive?: boolean;
    }): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePassword(id: string, newPassword: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    setRole(id: string, role: UserRole): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setPermissions(id: string, permissions: string[]): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
