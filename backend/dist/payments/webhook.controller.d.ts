import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
type MidtransPayload = {
    order_id: string;
    status_code: string;
    gross_amount: string;
    transaction_status: string;
    transaction_id?: string;
};
export declare class WebhookController {
    private ordersService;
    private prisma;
    private configService;
    constructor(ordersService: OrdersService, prisma: PrismaService, configService: ConfigService);
    handleMidtransWebhook(payload: MidtransPayload, signatureKey: string): Promise<{
        attempts: number;
        success: boolean;
        message: string;
    } | {
        attempts: number;
        success: boolean;
        message?: undefined;
    }>;
    getMidtransMonitor(minutes?: string): Promise<{
        rangeMinutes: number;
        since: Date;
        summary: {
            totalReceived: number;
            processed: number;
            warning: number;
            failed: number;
            invalidSignature: number;
        };
        recentFailures: {
            id: string;
            createdAt: Date;
            orderId: any;
            status: string;
            attempts: any;
            error: any;
        }[];
    }>;
    private createSignature;
    private wait;
    private getProcessingStatus;
}
export {};
