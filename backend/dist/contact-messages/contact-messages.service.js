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
exports.ContactMessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContactMessagesService = class ContactMessagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
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
    async findAll(params) {
        const { page = 1, limit = 20, status, search } = params;
        const skip = (page - 1) * limit;
        const where = {};
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
    async updateById(id, data, adminId) {
        const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Contact message not found');
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
    async bulkUpdate(ids, status, adminId, adminNotes) {
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
};
exports.ContactMessagesService = ContactMessagesService;
exports.ContactMessagesService = ContactMessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactMessagesService);
//# sourceMappingURL=contact-messages.service.js.map