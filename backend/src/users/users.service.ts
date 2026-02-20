import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const { page = 1, limit = 10, search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    
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

  async findById(id: string) {
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    role?: UserRole;
    permissions?: string[];
  }) {
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

  async update(id: string, data: {
    name?: string;
    role?: UserRole;
    permissions?: string[];
    isActive?: boolean;
  }) {
    const updateData: any = { ...data };
    
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

  async updatePassword(id: string, newPassword: string) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async setRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async setPermissions(id: string, permissions: string[]) {
    return this.prisma.user.update({
      where: { id },
      data: { permissions: JSON.stringify(permissions) },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }
}
