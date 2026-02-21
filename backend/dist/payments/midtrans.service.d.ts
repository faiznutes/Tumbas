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
        itemDetails?: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
        }>;
    }): Promise<{
        token: any;
        orderId: any;
    }>;
    verifySignature(signatureKey: string, orderId: string, statusCode: string, grossAmount: string): boolean;
}
