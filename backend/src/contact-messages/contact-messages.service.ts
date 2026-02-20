import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactMessagesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    subject: string;
    message: string;
  }) {
    return this.prisma.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        subject: data.subject.trim(),
        message: data.message.trim(),
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: ContactMessageStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactMessageWhereInput = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const [messages, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(
    id: string,
    data: { status?: ContactMessageStatus; adminNotes?: string },
    adminId?: string,
  ) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Contact message not found');
    }

    const nextStatus = data.status ?? existing.status;
    const shouldMarkProcessed = nextStatus !== 'NEW';

    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: nextStatus,
        adminNotes: data.adminNotes !== undefined ? data.adminNotes.trim() || null : existing.adminNotes,
        processedAt: shouldMarkProcessed ? new Date() : null,
        processedById: shouldMarkProcessed ? adminId || existing.processedById : null,
      },
      include: {
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async bulkUpdate(
    ids: string[],
    status: ContactMessageStatus,
    adminId?: string,
    adminNotes?: string,
  ) {
    if (ids.length === 0) {
      return { updated: 0 };
    }

    const shouldMarkProcessed = status !== 'NEW';
    const result = await this.prisma.contactMessage.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        adminNotes: adminNotes !== undefined ? adminNotes.trim() || null : undefined,
        processedAt: shouldMarkProcessed ? new Date() : null,
        processedById: shouldMarkProcessed ? adminId || null : null,
      },
    });

    return { updated: result.count };
  }
}
