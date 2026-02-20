import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
declare class CreateUserDto {
    email: string;
    password: string;
    name?: string;
    role?: UserRole;
    permissions?: string[];
}
declare class UpdateUserDto {
    name?: string;
    role?: UserRole;
    permissions?: string[];
    isActive?: boolean;
}
declare class UpdatePasswordDto {
    password: string;
}
declare class SetRoleDto {
    role: UserRole;
}
declare class SetPermissionsDto {
    permissions: string[];
}
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string, search?: string, role?: string): Promise<{
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
    create(data: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: UpdateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        permissions: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePassword(id: string, data: UpdatePasswordDto): Promise<{
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
    setRole(id: string, data: SetRoleDto): Promise<{
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
    setPermissions(id: string, data: SetPermissionsDto): Promise<{
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
export {};
