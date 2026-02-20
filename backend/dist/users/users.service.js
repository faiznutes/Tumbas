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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { page = 1, limit = 10, search, role } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { name: { contains: search } },
            ];
        }
        if (role) {
            where.role = role;
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    permissions: true,
                    isActive: true,
                    createdAt: true,
                    _count: { select: { products: true, orders: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                isActive: true,
                createdAt: true,
                _count: { select: { products: true, orders: true } },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async create(data) {
        const { password, permissions, ...userData } = data;
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                ...userData,
                passwordHash,
                permissions: JSON.stringify(permissions || []),
                role: userData.role || 'STAFF',
            },
        });
        const { passwordHash: _, ...result } = user;
        return result;
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.permissions) {
            updateData.permissions = JSON.stringify(data.permissions);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
        const { passwordHash: _, ...result } = user;
        return result;
    }
    async updatePassword(id, newPassword) {
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(newPassword, 10);
        return this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
    }
    async delete(id) {
        await this.prisma.user.delete({ where: { id } });
        return { success: true };
    }
    async setRole(id, role) {
        return this.prisma.user.update({
            where: { id },
            data: { role },
        });
    }
    async setPermissions(id, permissions) {
        return this.prisma.user.update({
            where: { id },
            data: { permissions: JSON.stringify(permissions) },
        });
    }
    async toggleActive(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map