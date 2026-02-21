import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Midtrans from 'midtrans-client';

@Injectable()
export class MidtransService {
  private snap: Midtrans.Snap;

  constructor(private configService: ConfigService) {
    const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
    const isProduction = this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true';

    this.snap = new Midtrans.Snap({
      isProduction,
      serverKey,
      clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
    });
  }

  async createTransaction(params: {
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
  }) {
    const parameter = {
      transaction_details: {
        order_id: `${params.orderCode}-${Date.now()}`,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      item_details: params.itemDetails,
      expiry: {
        unit: 'hours',
        duration: 24,
      },
    };

    const transaction = await this.snap.createTransaction(parameter);
    return {
      token: transaction.token,
      orderId: transaction.transaction_details.order_id,
    };
  }

  verifySignature(signatureKey: string, orderId: string, statusCode: string, grossAmount: string): boolean {
    const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
    const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    
    const signature = crypto
      .createHash('sha512')
      .update(input)
      .digest('hex');
    
    return signature === signatureKey;
  }
}
