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
    shippingCost?: number;
    shippingProvider?: string;
    shippingRegion?: string;
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
        data: any;
        meta: {
            total: any;
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
            id: any;
            orderCode: any;
            receiptNo: string;
            verificationCode: string;
            productTitle: any;
            amount: any;
            paymentStatus: any;
            createdAt: any;
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
            id: any;
            orderCode: any;
            receiptNo: string;
            verificationCode: string;
            shippingResi: string;
            shippedToExpedition: any;
            expeditionResi: any;
            expeditionName: any;
            shippedAt: any;
            productTitle: any;
            amount: any;
            paymentStatus: any;
            createdAt: any;
        };
    } | {
        valid: boolean;
        order: {
            id: any;
            orderCode: any;
            receiptNo: string;
            verificationCode: string;
            shippingResi: string;
            shippedToExpedition: any;
            expeditionResi: any;
            expeditionName: any;
            shippedAt: any;
            productTitle: any;
            amount: any;
            paymentStatus: any;
            createdAt: any;
        };
        reason?: undefined;
    }>;
    findById(id: string): Promise<any>;
    findPublicById(id: string, token?: string): Promise<any>;
    create(dto: CreateOrderDto): Promise<any>;
    markShippedToExpedition(id: string, dto: MarkShippedDto): Promise<any>;
}
export {};
