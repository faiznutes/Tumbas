import { ContactMessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class ContactMessagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        email: string;
        phone?: string;
        whatsapp?: string;
        subject: string;
        message: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ContactMessageStatus;
        message: string;
        phone: string | null;
        whatsapp: string | null;
        subject: string;
        adminNotes: string | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
    findAll(params: {
        page?: number;
        limit?: number;
        status?: ContactMessageStatus;
        search?: string;
    }): Promise<{
        data: ({
            processedBy: {
                id: string;
                email: string;
                name: string | null;
                role: import("@prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            email: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ContactMessageStatus;
            message: string;
            phone: string | null;
            whatsapp: string | null;
            subject: string;
            adminNotes: string | null;
            processedAt: Date | null;
            processedById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateById(id: string, data: {
        status?: ContactMessageStatus;
        adminNotes?: string;
    }, adminId?: string): Promise<{
        processedBy: {
            id: string;
            email: string;
            name: string | null;
            role: import("@prisma/client").$Enums.UserRole;
        } | null;
    } & {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ContactMessageStatus;
        message: string;
        phone: string | null;
        whatsapp: string | null;
        subject: string;
        adminNotes: string | null;
        processedAt: Date | null;
        processedById: string | null;
    }>;
    bulkUpdate(ids: string[], status: ContactMessageStatus, adminId?: string, adminNotes?: string): Promise<{
        updated: number;
    }>;
}
