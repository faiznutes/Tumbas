import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Prisma, PaymentStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../payments/midtrans.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private midtransService: MidtransService,
    private configService: ConfigService,
  ) {}

  private createPublicToken(orderId: string) {
    const secret = this.configService.get<string>('ORDER_PUBLIC_SECRET') || this.configService.get<string>('JWT_SECRET') || 'change-me';
    return crypto.createHmac('sha256', secret).update(orderId).digest('hex');
  }

  private createVerificationCode(orderCode: string) {
    const normalized = orderCode.toUpperCase();
    let acc = 0;
    for (let i = 0; i < normalized.length; i++) {
      acc = (acc + normalized.charCodeAt(i) * (i + 17)) % 99999999;
    }
    return `VRF-${String(acc).padStart(8, '0')}`;
  }

  private createShippingResi(orderCode: string) {
    const compact = orderCode.replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase();
    return `TMB-RESI-${compact}`;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    
    if (status) {
      where.paymentStatus = status;
    }
    
    if (search) {
      where.OR = [
        { orderCode: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findPublicById(id: string, token?: string) {
    if (!token || token !== this.createPublicToken(id)) {
      throw new UnauthorizedException('Invalid order token');
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderCode: true,
        amount: true,
        paymentStatus: true,
        shippedToExpedition: true,
        expeditionResi: true,
        expeditionName: true,
        shippedAt: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async markShippedToExpedition(id: string, data: { expeditionResi: string; expeditionName?: string }) {
    const expeditionResi = data.expeditionResi.trim();
    if (!expeditionResi) {
      throw new BadRequestException('Expedition resi is required');
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException('Order must be paid before shipping confirmation');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        shippedToExpedition: true,
        expeditionResi,
        expeditionName: data.expeditionName?.trim() || null,
        shippedAt: new Date(),
      },
      include: { product: true },
    });
  }

  async verifyReceipt(receiptNo: string, verificationCode: string) {
    const trimmedReceipt = (receiptNo || '').trim().toUpperCase();
    const trimmedCode = (verificationCode || '').trim().toUpperCase();

    if (!trimmedReceipt.startsWith('RCPT-')) {
      return { valid: false, reason: 'invalid_receipt_format' as const };
    }

    const orderCode = trimmedReceipt.replace(/^RCPT-/, '');
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      select: {
        id: true,
        orderCode: true,
        amount: true,
        paymentStatus: true,
        createdAt: true,
        product: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!order) {
      return { valid: false, reason: 'receipt_not_found' as const };
    }

    const expectedCode = this.createVerificationCode(order.orderCode);
    if (trimmedCode !== expectedCode) {
      return { valid: false, reason: 'verification_code_mismatch' as const };
    }

    return {
      valid: true,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        receiptNo: `RCPT-${order.orderCode}`,
        verificationCode: expectedCode,
        productTitle: order.product.title,
        amount: order.amount,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    };
  }

  async verifyByResi(resi: string) {
    const normalizedResi = (resi || '').trim().toUpperCase();
    if (!normalizedResi.startsWith('TMB-RESI-')) {
      return { valid: false, reason: 'invalid_resi_format' as const };
    }

    const orders = await this.prisma.order.findMany({
      select: {
        id: true,
        orderCode: true,
        amount: true,
        paymentStatus: true,
        shippedToExpedition: true,
        expeditionResi: true,
        expeditionName: true,
        shippedAt: true,
        createdAt: true,
        product: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2000,
    });

    const matched = orders.find(
      (order) => this.createShippingResi(order.orderCode) === normalizedResi,
    );

    if (!matched) {
      return { valid: false, reason: 'resi_not_found' as const };
    }

    if (!matched.shippedToExpedition || !matched.expeditionResi) {
      return {
        valid: false,
        reason: 'not_shipped_to_expedition' as const,
        order: {
          id: matched.id,
          orderCode: matched.orderCode,
          receiptNo: `RCPT-${matched.orderCode}`,
          verificationCode: this.createVerificationCode(matched.orderCode),
          shippingResi: normalizedResi,
          shippedToExpedition: matched.shippedToExpedition,
          expeditionResi: matched.expeditionResi,
          expeditionName: matched.expeditionName,
          shippedAt: matched.shippedAt,
          productTitle: matched.product.title,
          amount: matched.amount,
          paymentStatus: matched.paymentStatus,
          createdAt: matched.createdAt,
        },
      };
    }

    return {
      valid: true,
      order: {
        id: matched.id,
        orderCode: matched.orderCode,
        receiptNo: `RCPT-${matched.orderCode}`,
        verificationCode: this.createVerificationCode(matched.orderCode),
        shippingResi: normalizedResi,
        shippedToExpedition: matched.shippedToExpedition,
        expeditionResi: matched.expeditionResi,
        expeditionName: matched.expeditionName,
        shippedAt: matched.shippedAt,
        productTitle: matched.product.title,
        amount: matched.amount,
        paymentStatus: matched.paymentStatus,
        createdAt: matched.createdAt,
      },
    };
  }

  async create(data: {
    productId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    customerPostalCode: string;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.status !== 'AVAILABLE') {
        throw new BadRequestException('Product is not available');
      }

      const pendingOrders = await tx.order.count({
        where: {
          productId: data.productId,
          paymentStatus: 'PENDING',
        },
      });

      if (pendingOrders > 0) {
        throw new BadRequestException('There is already a pending order for this product');
      }

      const orderCode = `TMB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const amount = product.price + 15000;

      const order = await tx.order.create({
        data: {
          orderCode,
          productId: data.productId,
          amount,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          customerCity: data.customerCity,
          customerPostalCode: data.customerPostalCode,
          notes: data.notes,
          paymentStatus: 'PENDING',
        },
        include: { product: true },
      });

      const snapToken = await this.midtransService.createTransaction({
        orderId: order.id,
        orderCode: order.orderCode,
        amount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          midtransOrderId: snapToken.orderId,
          snapToken: snapToken.token,
        },
      });

      return {
        ...order,
        snapToken: snapToken.token,
        publicToken: this.createPublicToken(order.id),
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async updateStatus(id: string, status: PaymentStatus) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { paymentStatus: status },
      include: { product: true },
    });

    if (status === 'PAID') {
      await this.prisma.product.update({
        where: { id: order.productId },
        data: { status: 'SOLD' },
      });
    }

    return order;
  }

  async handleWebhook(payload: {
    order_id: string;
    transaction_status: string;
    transaction_id?: string;
    status_code?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { midtransOrderId: payload.order_id },
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.paymentStatus === 'PAID') {
        return { success: true, message: 'Already processed' };
      }

      let paymentStatus: PaymentStatus = 'PENDING';
      
      switch (payload.transaction_status) {
        case 'capture':
        case 'settlement':
          paymentStatus = 'PAID';
          break;
        case 'pending':
          paymentStatus = 'PENDING';
          break;
        case 'deny':
          paymentStatus = 'FAILED';
          break;
        case 'expire':
          paymentStatus = 'EXPIRED';
          break;
        case 'cancel':
          paymentStatus = 'CANCELLED';
          break;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          midtransTransactionId: payload.transaction_id,
          paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
        },
      });

      if (paymentStatus === 'PAID') {
        await tx.product.update({
          where: { id: order.productId },
          data: { status: 'SOLD' },
        });
      }

      return { success: true };
    });
  }
}
