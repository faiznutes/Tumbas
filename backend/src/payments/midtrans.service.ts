import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Midtrans from 'midtrans-client';

@Injectable()
export class MidtransService {
  private snap: Midtrans.Snap;
  private coreApi: Midtrans.CoreApi;

  constructor(private configService: ConfigService) {
    const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
    const isProduction = this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true';

    this.snap = new Midtrans.Snap({
      isProduction,
      serverKey,
      clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
    });

    this.coreApi = new Midtrans.CoreApi({
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

    const transaction = await this.snap.createTransaction(parameter) as {
      token?: string;
      order_id?: string;
      transaction_details?: {
        order_id?: string;
      };
      error_messages?: string[];
      status_message?: string;
    };

    if (!transaction?.token) {
      const reason = transaction?.error_messages?.join('; ') || transaction?.status_message || 'Midtrans transaction failed';
      throw new BadRequestException(reason);
    }

    return {
      token: transaction.token,
      orderId: transaction.order_id || transaction.transaction_details?.order_id || parameter.transaction_details.order_id,
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

  verifyNotificationSignature(params: {
    signatureKey?: string;
    orderId?: string;
    statusCode?: string;
    grossAmount?: string | number;
  }): boolean {
    if (!params.signatureKey || !params.orderId || !params.statusCode || params.grossAmount === undefined || params.grossAmount === null) {
      return false;
    }

    const rawGrossAmount = String(params.grossAmount);
    if (this.verifySignature(params.signatureKey, params.orderId, String(params.statusCode), rawGrossAmount)) {
      return true;
    }

    const numericGrossAmount = Number(rawGrossAmount);
    if (Number.isFinite(numericGrossAmount)) {
      return this.verifySignature(
        params.signatureKey,
        params.orderId,
        String(params.statusCode),
        numericGrossAmount.toFixed(2),
      );
    }

    return false;
  }

  async getTransactionStatus(orderId: string) {
    const result = (await this.coreApi.transaction.status(orderId)) as {
      order_id?: string;
      transaction_status?: string;
      transaction_id?: string;
      status_code?: string;
      fraud_status?: string;
    };

    return {
      order_id: result.order_id || orderId,
      transaction_status: result.transaction_status || 'pending',
      transaction_id: result.transaction_id,
      status_code: result.status_code,
      fraud_status: result.fraud_status,
    };
  }
}
