import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const prisma = {
    order: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const midtransService = {
    createTransaction: jest.fn(),
    getTransactionStatus: jest.fn(),
  } as any;

  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const shippingService = {
    getRates: jest.fn(),
  } as any;

  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'ORDER_PUBLIC_SECRET') return 'test-order-secret';
      if (key === 'JWT_SECRET') return 'fallback-secret';
      return undefined;
    });
    service = new OrdersService(prisma, midtransService, configService, shippingService);
  });

  it('rejects public order request without token', async () => {
    await expect(service.findPublicById('ord-1')).rejects.toThrow(UnauthorizedException);
  });

  it('returns sanitized public order with valid token', async () => {
    const orderId = 'ord-1';
    const token = crypto
      .createHmac('sha256', 'test-order-secret')
      .update(orderId)
      .digest('hex');

    prisma.order.findUnique.mockResolvedValue({
      id: orderId,
      orderCode: 'TMB-001',
      amount: 100000,
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      product: {
        id: 'p1',
        title: 'Product A',
        slug: 'product-a',
        price: 85000,
        status: 'AVAILABLE',
      },
    });

    const result = await service.findPublicById(orderId, token);

    expect(prisma.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: orderId } }),
    );
    expect(result).toHaveProperty('id', orderId);
    expect(result).toHaveProperty('product.slug', 'product-a');
  });

  it('accepts previous public token secret during transition', async () => {
    const orderId = 'ord-legacy';
    const legacySecret = 'legacy-order-secret';

    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'ORDER_PUBLIC_SECRET') return 'new-order-secret';
      if (key === 'ORDER_PUBLIC_SECRET_PREVIOUS') return legacySecret;
      if (key === 'JWT_SECRET') return 'fallback-secret';
      return undefined;
    });

    service = new OrdersService(prisma, midtransService, configService, shippingService);

    const legacyToken = crypto
      .createHmac('sha256', legacySecret)
      .update(orderId)
      .digest('hex');

    prisma.order.findUnique.mockResolvedValue({
      id: orderId,
      orderCode: 'TMB-LEGACY',
      amount: 120000,
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      orderItems: [],
      product: {
        id: 'p2',
        title: 'Legacy Product',
        slug: 'legacy-product',
        price: 120000,
        status: 'AVAILABLE',
      },
    });

    const result = await service.findPublicById(orderId, legacyToken);
    expect(result).toHaveProperty('id', orderId);
  });

  it('throws not found when public order does not exist', async () => {
    const orderId = 'missing-order';
    const token = crypto
      .createHmac('sha256', 'test-order-secret')
      .update(orderId)
      .digest('hex');

    prisma.order.findUnique.mockResolvedValue(null);

    await expect(service.findPublicById(orderId, token)).rejects.toThrow(NotFoundException);
  });

  it('maps Midtrans expire status to EXPIRED', async () => {
    const tx = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'o1',
          productId: 'p1',
          paymentStatus: 'PENDING',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      product: {
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (fn: any) => fn(tx));

    await service.handleWebhook({
      order_id: 'mid-1',
      transaction_status: 'expire',
      transaction_id: 'trx-1',
    });

    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: 'EXPIRED' }),
      }),
    );
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it('verifies receipt with matching verification code', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      orderCode: 'TMB-ABC123',
      amount: 100000,
      paymentStatus: 'PAID',
      createdAt: new Date('2026-02-20T10:00:00.000Z'),
      product: { title: 'Product A' },
    });

    const result = await service.verifyReceipt('RCPT-TMB-ABC123', 'VRF-00013078');

    expect(result).toEqual(
      expect.objectContaining({
        valid: true,
        order: expect.objectContaining({
          orderCode: 'TMB-ABC123',
          receiptNo: 'RCPT-TMB-ABC123',
          verificationCode: 'VRF-00013078',
        }),
      }),
    );
  });

  it('fails verification when code does not match', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      orderCode: 'TMB-ABC123',
      amount: 100000,
      paymentStatus: 'PAID',
      createdAt: new Date('2026-02-20T10:00:00.000Z'),
      product: { title: 'Product A' },
    });

    const result = await service.verifyReceipt('RCPT-TMB-ABC123', 'VRF-00000000');

    expect(result).toEqual({
      valid: false,
      reason: 'verification_code_mismatch',
    });
  });

  it('verifies order by shipping resi input', async () => {
    prisma.order.findMany = jest.fn().mockResolvedValue([
      {
        id: 'o1',
        orderCode: 'TMB-ABC123',
        amount: 100000,
        paymentStatus: 'PAID',
        shippedToExpedition: true,
        expeditionResi: 'JNE1234567890',
        expeditionName: 'JNE',
        shippedAt: new Date('2026-02-20T11:00:00.000Z'),
        createdAt: new Date('2026-02-20T10:00:00.000Z'),
        product: { title: 'Product A' },
      },
    ]);

    const result = await service.verifyByResi('TMB-RESI-TMBABC123');

    expect(result).toEqual(
      expect.objectContaining({
        valid: true,
        order: expect.objectContaining({
          orderCode: 'TMB-ABC123',
          shippingResi: 'TMB-RESI-TMBABC123',
          expeditionResi: 'JNE1234567890',
        }),
      }),
    );
  });

  it('returns not shipped when expedition handover not confirmed', async () => {
    prisma.order.findMany = jest.fn().mockResolvedValue([
      {
        id: 'o1',
        orderCode: 'TMB-ABC123',
        amount: 100000,
        paymentStatus: 'PAID',
        shippedToExpedition: false,
        expeditionResi: null,
        expeditionName: null,
        shippedAt: null,
        createdAt: new Date('2026-02-20T10:00:00.000Z'),
        product: { title: 'Product A' },
      },
    ]);

    const result = await service.verifyByResi('TMB-RESI-TMBABC123');

    expect(result).toEqual(
      expect.objectContaining({
        valid: false,
        reason: 'not_shipped_to_expedition',
      }),
    );
  });
});
