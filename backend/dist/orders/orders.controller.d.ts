import { OrdersService } from './orders.service';
import { PaymentStatus } from '@prisma/client';
declare class CreateOrderDto {
    productId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    customerPostalCode: string;
    notes?: string;
}
declare class VerifyReceiptQueryDto {
    receiptNo: string;
    verificationCode: string;
}
declare class VerifyResiQueryDto {
    resi: string;
}
declare class MarkShippedDto {
    expeditionResi: string;
    expeditionName?: string;
}
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    findAll(page?: string, limit?: string, status?: PaymentStatus, search?: string): Promise<{
        data: ({
            product: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string | null;
            productId: string;
            customerEmail: string;
            customerName: string;
            orderCode: string;
            amount: number;
            customerPhone: string;
            customerAddress: string;
            customerCity: string;
            customerPostalCode: string;
            notes: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            midtransTransactionId: string | null;
            midtransOrderId: string | null;
            snapToken: string | null;
            shippedToExpedition: boolean;
            expeditionResi: string | null;
            expeditionName: string | null;
            shippedAt: Date | null;
            paidAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    verifyReceipt(query: VerifyReceiptQueryDto): Promise<{
        valid: boolean;
        reason: "invalid_receipt_format";
        order?: undefined;
    } | {
        valid: boolean;
        reason: "receipt_not_found";
        order?: undefined;
    } | {
        valid: boolean;
        reason: "verification_code_mismatch";
        order?: undefined;
    } | {
        valid: boolean;
        order: {
            id: string;
            orderCode: string;
            receiptNo: string;
            verificationCode: string;
            productTitle: string;
            amount: number;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
        };
        reason?: undefined;
    }>;
    verifyResi(query: VerifyResiQueryDto): Promise<{
        valid: boolean;
        reason: "invalid_resi_format";
        order?: undefined;
    } | {
        valid: boolean;
        reason: "resi_not_found";
        order?: undefined;
    } | {
        valid: boolean;
        reason: "not_shipped_to_expedition";
        order: {
            id: string;
            orderCode: string;
            receiptNo: string;
            verificationCode: string;
            shippingResi: string;
            shippedToExpedition: boolean;
            expeditionResi: string | null;
            expeditionName: string | null;
            shippedAt: Date | null;
            productTitle: string;
            amount: number;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
        };
    } | {
        valid: boolean;
        order: {
            id: string;
            orderCode: string;
            receiptNo: string;
            verificationCode: string;
            shippingResi: string;
            shippedToExpedition: true;
            expeditionResi: string;
            expeditionName: string | null;
            shippedAt: Date | null;
            productTitle: string;
            amount: number;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
        };
        reason?: undefined;
    }>;
    findById(id: string): Promise<{
        product: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string | null;
        productId: string;
        customerEmail: string;
        customerName: string;
        orderCode: string;
        amount: number;
        customerPhone: string;
        customerAddress: string;
        customerCity: string;
        customerPostalCode: string;
        notes: string | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        midtransTransactionId: string | null;
        midtransOrderId: string | null;
        snapToken: string | null;
        shippedToExpedition: boolean;
        expeditionResi: string | null;
        expeditionName: string | null;
        shippedAt: Date | null;
        paidAt: Date | null;
    }>;
    findPublicById(id: string, token?: string): Promise<{
        product: {
            id: string;
            status: import("@prisma/client").$Enums.ProductStatus;
            title: string;
            slug: string;
            price: number;
        };
        id: string;
        createdAt: Date;
        orderCode: string;
        amount: number;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        shippedToExpedition: boolean;
        expeditionResi: string | null;
        expeditionName: string | null;
        shippedAt: Date | null;
    }>;
    create(dto: CreateOrderDto): Promise<{
        snapToken: any;
        publicToken: string;
        product: {
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
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string | null;
        productId: string;
        customerEmail: string;
        customerName: string;
        orderCode: string;
        amount: number;
        customerPhone: string;
        customerAddress: string;
        customerCity: string;
        customerPostalCode: string;
        notes: string | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        midtransTransactionId: string | null;
        midtransOrderId: string | null;
        shippedToExpedition: boolean;
        expeditionResi: string | null;
        expeditionName: string | null;
        shippedAt: Date | null;
        paidAt: Date | null;
    }>;
    markShippedToExpedition(id: string, dto: MarkShippedDto): Promise<{
        product: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string | null;
        productId: string;
        customerEmail: string;
        customerName: string;
        orderCode: string;
        amount: number;
        customerPhone: string;
        customerAddress: string;
        customerCity: string;
        customerPostalCode: string;
        notes: string | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        midtransTransactionId: string | null;
        midtransOrderId: string | null;
        snapToken: string | null;
        shippedToExpedition: boolean;
        expeditionResi: string | null;
        expeditionName: string | null;
        shippedAt: Date | null;
        paidAt: Date | null;
    }>;
}
export {};
