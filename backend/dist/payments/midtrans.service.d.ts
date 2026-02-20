import { ConfigService } from '@nestjs/config';
export declare class MidtransService {
    private configService;
    private snap;
    constructor(configService: ConfigService);
    createTransaction(params: {
        orderId: string;
        orderCode: string;
        amount: number;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
    }): Promise<{
        token: any;
        orderId: any;
    }>;
    verifySignature(signatureKey: string, orderId: string, statusCode: string, grossAmount: string): boolean;
}
