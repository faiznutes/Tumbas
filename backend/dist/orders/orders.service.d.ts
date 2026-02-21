import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../payments/midtrans.service';
import { ConfigService } from '@nestjs/config';
export declare class OrdersService {
    private prisma;
    private midtransService;
    private configService;
    constructor(prisma: PrismaService, midtransService: MidtransService, configService: ConfigService);
    private createPublicToken;
    private createVerificationCode;
    private createShippingResi;
    findAll(params: {
        page?: number;
        limit?: number;
        status?: PaymentStatus;
        search?: string;
    }): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    findPublicById(id: string, token?: string): Promise<any>;
    markShippedToExpedition(id: string, data: {
        expeditionResi: string;
        expeditionName?: string;
    }): Promise<any>;
    verifyReceipt(receiptNo: string, verificationCode: string): Promise<{
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
    verifyByResi(resi: string): Promise<{
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
    create(data: {
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
    }): Promise<any>;
    updateStatus(id: string, status: PaymentStatus): Promise<any>;
    handleWebhook(payload: {
        order_id: string;
        transaction_status: string;
        transaction_id?: string;
        status_code?: string;
    }): Promise<any>;
}
