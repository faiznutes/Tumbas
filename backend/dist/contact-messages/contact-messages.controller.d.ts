import { ContactMessageStatus } from '@prisma/client';
import { ContactMessagesService } from './contact-messages.service';
declare class CreateContactMessageDto {
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    subject: string;
    message: string;
}
declare class UpdateContactMessageDto {
    status?: ContactMessageStatus;
    adminNotes?: string;
}
declare class BulkUpdateContactMessageDto {
    ids: string[];
    status: ContactMessageStatus;
    adminNotes?: string;
}
export declare class ContactMessagesController {
    private readonly contactMessagesService;
    constructor(contactMessagesService: ContactMessagesService);
    create(dto: CreateContactMessageDto): Promise<{
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
    findAll(page?: string, limit?: string, status?: ContactMessageStatus, search?: string): Promise<{
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
    updateById(id: string, dto: UpdateContactMessageDto, req: any): Promise<{
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
    bulkUpdate(dto: BulkUpdateContactMessageDto, req: any): Promise<{
        updated: number;
    }>;
}
export {};
