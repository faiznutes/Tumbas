import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../payments/midtrans.service';
import { ConfigService } from '@nestjs/config';
import { ShippingService } from '../shipping/shipping.service';
export declare class OrdersService {
    private prisma;
    private midtransService;
    private configService;
    private shippingService;
    constructor(prisma: PrismaService, midtransService: MidtransService, configService: ConfigService, shippingService: ShippingService);
    private createPublicToken;
    private createVerificationCode;
    private createShippingResi;
    private extractProductVariants;
    private reduceStock;
    findAll(params: {
        page?: number;
        limit?: number;
        status?: PaymentStatus;
        search?: string;
    }): Promise<{
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
                weightGram: number;
                variants: Prisma.JsonValue | null;
                createdById: string | null;
            };
            orderItems: {
                id: string;
                createdAt: Date;
                productId: string;
                selectedVariantKey: string | null;
                selectedVariantLabel: string | null;
                itemWeightGram: number;
                orderId: string;
                productTitleSnapshot: string;
                unitPrice: number;
                quantity: number;
            }[];
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
            selectedVariantKey: string | null;
            selectedVariantLabel: string | null;
            itemWeightGram: number;
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
            weightGram: number;
            variants: Prisma.JsonValue | null;
            createdById: string | null;
        };
        orderItems: {
            id: string;
            createdAt: Date;
            productId: string;
            selectedVariantKey: string | null;
            selectedVariantLabel: string | null;
            itemWeightGram: number;
            orderId: string;
            productTitleSnapshot: string;
            unitPrice: number;
            quantity: number;
        }[];
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
        selectedVariantKey: string | null;
        selectedVariantLabel: string | null;
        itemWeightGram: number;
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
        orderItems: {
            id: string;
            createdAt: Date;
            productId: string;
            selectedVariantKey: string | null;
            selectedVariantLabel: string | null;
            itemWeightGram: number;
            orderId: string;
            productTitleSnapshot: string;
            unitPrice: number;
            quantity: number;
        }[];
        orderCode: string;
        amount: number;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        shippedToExpedition: boolean;
        expeditionResi: string | null;
        expeditionName: string | null;
        shippedAt: Date | null;
    }>;
    markShippedToExpedition(id: string, data: {
        expeditionResi: string;
        expeditionName?: string;
    }): Promise<{
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
            weightGram: number;
            variants: Prisma.JsonValue | null;
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
        selectedVariantKey: string | null;
        selectedVariantLabel: string | null;
        itemWeightGram: number;
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
    create(data: {
        productId?: string;
        items?: Array<{
            productId: string;
            quantity: number;
            selectedVariantKey?: string;
            selectedVariantLabel?: string;
        }>;
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
        shippingService?: string;
        shippingEtd?: string;
        shippingWeightGram?: number;
        shippingDestinationCityId?: string;
        selectedVariantKey?: string;
        selectedVariantLabel?: string;
    }): Promise<{
        snapToken: string;
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
            weightGram: number;
            variants: Prisma.JsonValue | null;
            createdById: string | null;
        };
        orderItems: {
            id: string;
            createdAt: Date;
            productId: string;
            selectedVariantKey: string | null;
            selectedVariantLabel: string | null;
            itemWeightGram: number;
            orderId: string;
            productTitleSnapshot: string;
            unitPrice: number;
            quantity: number;
        }[];
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
        selectedVariantKey: string | null;
        selectedVariantLabel: string | null;
        itemWeightGram: number;
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
    updateStatus(id: string, status: PaymentStatus): Promise<{
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
            weightGram: number;
            variants: Prisma.JsonValue | null;
            createdById: string | null;
        };
        orderItems: {
            id: string;
            createdAt: Date;
            productId: string;
            selectedVariantKey: string | null;
            selectedVariantLabel: string | null;
            itemWeightGram: number;
            orderId: string;
            productTitleSnapshot: string;
            unitPrice: number;
            quantity: number;
        }[];
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
        selectedVariantKey: string | null;
        selectedVariantLabel: string | null;
        itemWeightGram: number;
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
    handleWebhook(payload: {
        order_id: string;
        transaction_status: string;
        transaction_id?: string;
        status_code?: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
}
