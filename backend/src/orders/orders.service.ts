import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../payments/midtrans.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private midtransService: MidtransService,
    private configService: ConfigService,
    private shippingService: ShippingService,
  ) {}

  private getPublicTokenSecrets() {
    const primary = this.configService.get<string>('ORDER_PUBLIC_SECRET') || this.configService.get<string>('JWT_SECRET') || 'change-me';
    const previous = this.configService.get<string>('ORDER_PUBLIC_SECRET_PREVIOUS');
    return [primary, previous].filter((value): value is string => Boolean(value && value.trim()));
  }

  private createPublicToken(orderId: string) {
    const [secret] = this.getPublicTokenSecrets();
    return crypto.createHmac('sha256', secret || 'change-me').update(orderId).digest('hex');
  }

  private isValidPublicToken(orderId: string, token?: string) {
    if (!token) return false;
    const normalizedToken = token.trim();
    return this.getPublicTokenSecrets().some((secret) => {
      const expected = crypto.createHmac('sha256', secret).update(orderId).digest('hex');
      return expected === normalizedToken;
    });
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

  private normalizeResiInput(resi: string) {
    return (resi || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9-]/g, '');
  }

  private normalizeResiForCompare(resi: string) {
    return this.normalizeResiInput(resi).replace(/-/g, '');
  }

  private extractProductVariants(product: { variants: Prisma.JsonValue | null }) {
    if (!Array.isArray(product.variants)) return [] as Array<{ key: string; label: string; stock: number; price?: number; weightGram?: number }>;
    return product.variants as unknown as Array<{ key: string; label: string; stock: number; price?: number; weightGram?: number }>;
  }

  private async reduceStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    variantKey?: string | null,
  ) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) return;

    const qty = Math.max(1, quantity);
    const variants = this.extractProductVariants(product);
    if (variantKey && variants.length > 0) {
      const index = variants.findIndex((variant) => variant.key === variantKey);
      if (index >= 0) {
        variants[index] = {
          ...variants[index],
          stock: Math.max(0, Number(variants[index].stock || 0) - qty),
        };
      }

      const remainingVariantStock = variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0);
      await tx.product.update({
        where: { id: productId },
        data: {
          variants,
          stock: remainingVariantStock,
          status: remainingVariantStock > 0 ? 'AVAILABLE' : 'SOLD',
        },
      });
      return;
    }

    const nextStock = Math.max(0, (product.stock || 0) - qty);
    await tx.product.update({
      where: { id: productId },
      data: { stock: nextStock, status: nextStock > 0 ? 'AVAILABLE' : 'SOLD' },
    });
  }

  private getPendingTimeoutMinutes() {
    const raw = Number(this.configService.get<string>('ORDER_PENDING_TIMEOUT_MINUTES') || 120);
    if (!Number.isFinite(raw)) return 120;
    return Math.max(5, Math.floor(raw));
  }

  private async expireStalePendingOrders() {
    const timeoutMinutes = this.getPendingTimeoutMinutes();
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    await this.prisma.order.updateMany({
      where: {
        paymentStatus: 'PENDING',
        createdAt: { lt: cutoff },
        paidAt: null,
      },
      data: { paymentStatus: 'EXPIRED' },
    });
  }

  private async getStoreTaxRate(tx: Prisma.TransactionClient) {
    const setting = await tx.siteSettings.findUnique({ where: { key: 'store_tax_rate' } });
    const parsed = parseInt(setting?.value || '', 10);
    if (!Number.isFinite(parsed)) return 11;
    return Math.max(0, parsed);
  }

  private async getActiveWeeklyDealConfig(tx: Prisma.TransactionClient) {
    const keys = [
      'weekly_deal_enabled',
      'weekly_deal_end_date',
      'weekly_deal_discount',
      'weekly_deal_selected_product_ids',
      'weekly_deal_discount_type',
      'weekly_deal_discount_value',
    ];
    const settings = await tx.siteSettings.findMany({ where: { key: { in: keys } } });
    const map = new Map(settings.map((setting) => [setting.key, setting.value]));

    const enabled = (map.get('weekly_deal_enabled') || 'true') === 'true';
    if (!enabled) return null;

    const endDateRaw = (map.get('weekly_deal_end_date') || '').trim();
    if (endDateRaw) {
      const endDate = new Date(endDateRaw);
      if (Number.isFinite(endDate.getTime())) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (Date.now() > endOfDay.getTime()) {
          return null;
        }
      }
    }

    const selectedProductIds = (map.get('weekly_deal_selected_product_ids') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (selectedProductIds.length === 0) {
      return null;
    }

    const discountTypeRaw = (map.get('weekly_deal_discount_type') || 'percentage').trim().toLowerCase();
    const discountType = discountTypeRaw === 'amount' ? 'amount' : 'percentage';
    const discountValueRaw = parseInt(map.get('weekly_deal_discount_value') || '', 10);
    const fallbackDiscountRaw = parseInt(map.get('weekly_deal_discount') || '', 10);
    const discountValue = Math.max(
      0,
      Number.isFinite(discountValueRaw) && discountValueRaw > 0 ? discountValueRaw : (Number.isFinite(fallbackDiscountRaw) ? fallbackDiscountRaw : 0),
    );

    if (discountValue <= 0) {
      return null;
    }

    return {
      selectedProductIds: new Set(selectedProductIds),
      discountType,
      discountValue,
    };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
    includeExpired?: boolean;
  }) {
    await this.expireStalePendingOrders();

    const { page = 1, limit = 20, status, search, includeExpired = false } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    
    if (status) {
      where.paymentStatus = status;
    } else if (!includeExpired) {
      where.paymentStatus = { notIn: ['EXPIRED', 'CANCELLED'] };
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
        include: { product: true, orderItems: true },
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
    await this.expireStalePendingOrders();

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { product: true, orderItems: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findPublicById(id: string, token?: string) {
    if (!this.isValidPublicToken(id, token)) {
      throw new UnauthorizedException('Invalid order token');
    }

    await this.expireStalePendingOrders();

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
        orderItems: true,
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

  async syncPaymentStatus(id: string, token?: string) {
    if (!this.isValidPublicToken(id, token)) {
      throw new UnauthorizedException('Invalid order token');
    }

    await this.expireStalePendingOrders();

    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        paymentStatus: true,
        midtransOrderId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED') {
      return this.findPublicById(id, token);
    }

    if (!order.midtransOrderId) {
      return this.findPublicById(id, token);
    }

    const transaction = await this.midtransService.getTransactionStatus(order.midtransOrderId);
    await this.handleWebhook({
      order_id: transaction.order_id,
      transaction_status: transaction.transaction_status,
      transaction_id: transaction.transaction_id,
      status_code: transaction.status_code,
    });

    return this.findPublicById(id, token);
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

  async returnToWarehouse(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        shippedToExpedition: false,
        expeditionResi: null,
        expeditionName: null,
        shippedAt: null,
      },
      include: { product: true },
    });
  }

  async cancelByAdmin(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'CANCELLED',
        shippedToExpedition: false,
        expeditionResi: null,
        expeditionName: null,
        shippedAt: null,
      },
      include: { product: true },
    });
  }

  async bulkMarkShippedToExpedition(data: {
    orderIds: string[];
    expeditionResi: string;
    expeditionName?: string;
  }) {
    const orderIds = Array.from(new Set((data.orderIds || []).map((id) => id?.trim()).filter(Boolean)));
    if (orderIds.length === 0) {
      throw new BadRequestException('At least one order id is required');
    }
    if (orderIds.length > 100) {
      throw new BadRequestException('Maximum 100 orders per bulk shipping confirmation');
    }

    const expeditionResiRaw = data.expeditionResi.trim();
    if (!expeditionResiRaw) {
      throw new BadRequestException('Expedition resi is required');
    }

    const expeditionName = data.expeditionName?.trim() || null;
    const normalizedPrefix = expeditionResiRaw.toUpperCase().replace(/\s+/g, '-');

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        orderCode: true,
        paymentStatus: true,
        shippedToExpedition: true,
      },
    });

    const orderMap = new Map(orders.map((order) => [order.id, order]));
    const success: Array<{ id: string; orderCode: string; expeditionResi: string }> = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of orderIds) {
      const order = orderMap.get(id);
      if (!order) {
        failed.push({ id, reason: 'not_found' });
        continue;
      }
      if (order.paymentStatus !== 'PAID') {
        failed.push({ id, reason: 'not_paid' });
        continue;
      }
      if (order.shippedToExpedition) {
        failed.push({ id, reason: 'already_shipped' });
        continue;
      }

      const expeditionResi =
        orderIds.length === 1 ? expeditionResiRaw : `${normalizedPrefix}-${order.orderCode}`;

      try {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            shippedToExpedition: true,
            expeditionResi,
            expeditionName,
            shippedAt: new Date(),
          },
        });
        success.push({ id: order.id, orderCode: order.orderCode, expeditionResi });
      } catch {
        failed.push({ id: order.id, reason: 'update_failed' });
      }
    }

    return {
      successCount: success.length,
      failedCount: failed.length,
      success,
      failed,
    };
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
    const normalizedResi = this.normalizeResiInput(resi);
    const compareInput = this.normalizeResiForCompare(normalizedResi);
    if (compareInput.length < 6) {
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
        orderItems: {
          select: {
            id: true,
            productTitleSnapshot: true,
            quantity: true,
            selectedVariantLabel: true,
          },
        },
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
      (order) => {
        const orderCodeCompare = this.normalizeResiForCompare(order.orderCode);
        const receiptNoCompare = this.normalizeResiForCompare(`RCPT-${order.orderCode}`);
        const tumbasResi = this.createShippingResi(order.orderCode);
        const tumbasCompare = this.normalizeResiForCompare(tumbasResi);
        const expeditionCompare = this.normalizeResiForCompare(order.expeditionResi || '');
        return (
          compareInput === orderCodeCompare ||
          compareInput === receiptNoCompare ||
          compareInput === tumbasCompare ||
          compareInput === expeditionCompare
        );
      },
    );

    if (!matched) {
      return { valid: false, reason: 'resi_not_found' as const };
    }

    const mappedItems = (matched.orderItems || []).map((item) => ({
      id: item.id,
      title: item.productTitleSnapshot,
      quantity: item.quantity,
      variantLabel: item.selectedVariantLabel,
    }));
    const totalItems = mappedItems.length > 0
      ? mappedItems.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0)
      : 1;

    return {
      valid: true,
      order: {
        id: matched.id,
        orderCode: matched.orderCode,
        receiptNo: `RCPT-${matched.orderCode}`,
        verificationCode: this.createVerificationCode(matched.orderCode),
        shippingResi: matched.expeditionResi || this.createShippingResi(matched.orderCode),
        shippedToExpedition: matched.shippedToExpedition,
        expeditionResi: matched.expeditionResi,
        expeditionName: matched.expeditionName,
        shippedAt: matched.shippedAt,
        productTitle: matched.product.title,
        items: mappedItems,
        totalItems,
        amount: matched.amount,
        paymentStatus: matched.paymentStatus,
        createdAt: matched.createdAt,
        publicToken: this.createPublicToken(matched.id),
      },
    };
  }

  async create(data: {
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
  }) {
    return this.prisma.$transaction(async (tx) => {
      const requestedItems = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : data.productId
          ? [{
            productId: data.productId,
            quantity: 1,
            selectedVariantKey: data.selectedVariantKey,
            selectedVariantLabel: data.selectedVariantLabel,
          }]
          : [];

      if (requestedItems.length === 0) {
        throw new BadRequestException('Produk pesanan tidak boleh kosong');
      }

      const mergedMap = new Map<string, { productId: string; quantity: number; selectedVariantKey?: string; selectedVariantLabel?: string }>();
      for (const item of requestedItems) {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const variantKey = item.selectedVariantKey?.trim();
        const key = `${item.productId}:${variantKey || 'default'}`;
        const existing = mergedMap.get(key);
        mergedMap.set(key, {
          productId: item.productId,
          quantity: (existing?.quantity || 0) + quantity,
          selectedVariantKey: variantKey,
          selectedVariantLabel: item.selectedVariantLabel?.trim(),
        });
      }

      const mergedItems = Array.from(mergedMap.values());
      const products = await tx.product.findMany({
        where: {
          id: { in: mergedItems.map((item) => item.productId) },
        },
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      const normalizedItems: Array<{
        productId: string;
        productTitleSnapshot: string;
        unitPrice: number;
        quantity: number;
        selectedVariantKey?: string | null;
        selectedVariantLabel?: string | null;
        itemWeightGram: number;
      }> = [];

      for (const item of mergedItems) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException('Product not found');
        }
        if (product.status !== 'AVAILABLE') {
          throw new BadRequestException(`Produk ${product.title} tidak tersedia`);
        }

        const variants = this.extractProductVariants(product);
        const selectedVariant = item.selectedVariantKey
          ? variants.find((variant) => variant.key === item.selectedVariantKey)
          : undefined;

        if (item.selectedVariantKey && !selectedVariant) {
          throw new BadRequestException(`Varian produk ${product.title} tidak valid`);
        }

        if (selectedVariant) {
          if (Number(selectedVariant.stock || 0) < item.quantity) {
            throw new BadRequestException(`Stok varian ${selectedVariant.label} untuk ${product.title} tidak mencukupi`);
          }
        } else if ((product.stock || 0) < item.quantity) {
          throw new BadRequestException(`Stok produk ${product.title} tidak mencukupi`);
        }

        const unitPrice = selectedVariant && Number(selectedVariant.price || 0) > 0
          ? Number(selectedVariant.price)
          : product.price;
        const itemWeightGram = selectedVariant?.weightGram
          ? Math.max(1, Number(selectedVariant.weightGram))
          : Math.max(1, Number(product.weightGram || 1000));

        normalizedItems.push({
          productId: product.id,
          productTitleSnapshot: product.title,
          unitPrice,
          quantity: item.quantity,
          selectedVariantKey: item.selectedVariantKey || null,
          selectedVariantLabel: item.selectedVariantLabel || selectedVariant?.label || null,
          itemWeightGram,
        });
      }

      const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const totalWeightGram = normalizedItems.reduce((sum, item) => sum + item.itemWeightGram * item.quantity, 0);
      const weeklyDeal = await this.getActiveWeeklyDealConfig(tx);

      const discountedItems = normalizedItems.map((item) => {
        const eligibleForWeeklyDeal = Boolean(weeklyDeal?.selectedProductIds.has(item.productId));
        if (!eligibleForWeeklyDeal || !weeklyDeal) {
          return {
            ...item,
            discountedUnitPrice: item.unitPrice,
            discountPerUnit: 0,
          };
        }

        const rawDiscount = weeklyDeal.discountType === 'amount'
          ? weeklyDeal.discountValue
          : Math.round((item.unitPrice * weeklyDeal.discountValue) / 100);
        const discountPerUnit = Math.min(item.unitPrice, Math.max(0, rawDiscount));
        return {
          ...item,
          discountedUnitPrice: Math.max(0, item.unitPrice - discountPerUnit),
          discountPerUnit,
        };
      });

      const discountedSubtotal = discountedItems.reduce((sum, item) => sum + item.discountedUnitPrice * item.quantity, 0);
      const discountTotal = discountedItems.reduce((sum, item) => sum + item.discountPerUnit * item.quantity, 0);

      const orderCode = `TMB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      let shippingCost = Math.max(0, data.shippingCost ?? 0);
      const shippingWeightGram = Math.max(1, data.shippingWeightGram ?? (totalWeightGram || 1000));
      let resolvedShippingService = data.shippingService?.trim() || '';
      let resolvedShippingEtd = data.shippingEtd?.trim() || '';

      if (data.shippingProvider && data.shippingDestinationCityId) {
        const rates = await this.shippingService.getRates({
          destinationCityId: data.shippingDestinationCityId,
          courier: data.shippingProvider,
          weightGram: shippingWeightGram,
        });
        if (!rates.services.length) {
          throw new BadRequestException('Layanan kurir tidak tersedia untuk alamat tujuan');
        }

        const selectedService = data.shippingService
          ? rates.services.find((service) => service && service.service.toLowerCase() === data.shippingService!.toLowerCase())
          : rates.services[0];

        if (!selectedService) {
          throw new BadRequestException('Layanan pengiriman yang dipilih tidak valid');
        }

        shippingCost = selectedService.cost;
        resolvedShippingService = selectedService.service;
        resolvedShippingEtd = selectedService.etd;
      } else if (!data.shippingProvider) {
        throw new BadRequestException('Kurir pengiriman wajib dipilih');
      }

      const taxableBase = discountedSubtotal + shippingCost;
      const taxRate = await this.getStoreTaxRate(tx);
      const taxAmount = Math.round((taxableBase * taxRate) / 100);
      const amount = taxableBase + taxAmount;
      const shippingNote = [
        data.shippingProvider ? `Courier: ${data.shippingProvider}` : null,
        resolvedShippingService ? `Service: ${resolvedShippingService}` : null,
        resolvedShippingEtd ? `ETD: ${resolvedShippingEtd}` : null,
        data.shippingRegion ? `Region: ${data.shippingRegion}` : null,
        data.shippingDestinationCityId ? `Destination City ID: ${data.shippingDestinationCityId}` : null,
        `Weight: ${shippingWeightGram}g`,
        `Subtotal: ${Math.round(subtotal)}`,
        `Discount: ${Math.round(discountTotal)}`,
        `Shipping: ${shippingCost}`,
        `Tax ${taxRate}%: ${taxAmount}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const firstItem = normalizedItems[0];

      const order = await tx.order.create({
        data: {
          orderCode,
          productId: firstItem.productId,
          amount,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          customerCity: data.customerCity,
          customerPostalCode: data.customerPostalCode,
          selectedVariantKey: firstItem.selectedVariantKey || null,
          selectedVariantLabel: firstItem.selectedVariantLabel || null,
          itemWeightGram: Math.max(1, Math.round(firstItem.itemWeightGram)),
          notes: data.notes ? `${data.notes}\n${shippingNote}` : shippingNote,
          paymentStatus: 'PENDING',
          orderItems: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              productTitleSnapshot: item.productTitleSnapshot,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              selectedVariantKey: item.selectedVariantKey || null,
              selectedVariantLabel: item.selectedVariantLabel || null,
              itemWeightGram: Math.max(1, Math.round(item.itemWeightGram)),
            })),
          },
        },
        include: { product: true, orderItems: true },
      });

      const snapToken = await this.midtransService.createTransaction({
        orderId: order.id,
        orderCode: order.orderCode,
        amount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        itemDetails: [
          ...discountedItems.map((item) => ({
            id: item.productId,
            name: `${item.productTitleSnapshot}${item.selectedVariantLabel ? ` (${item.selectedVariantLabel})` : ''}`.slice(0, 50),
            price: Math.round(item.discountedUnitPrice),
            quantity: item.quantity,
          })),
          {
            id: 'shipping',
            name: `Ongkir ${data.shippingProvider || ''}`.trim(),
            price: Math.round(shippingCost),
            quantity: 1,
          },
          ...(taxAmount > 0 ? [{
            id: 'tax',
            name: `Pajak ${taxRate}%`,
            price: Math.round(taxAmount),
            quantity: 1,
          }] : []),
        ],
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
      include: { product: true, orderItems: true },
    });

    if (status === 'PAID') {
      if (order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          await this.reduceStock(this.prisma, item.productId, item.quantity, item.selectedVariantKey);
        }
      } else {
        await this.reduceStock(this.prisma, order.productId, 1, order.selectedVariantKey);
      }
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
        include: { orderItems: true },
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
        if (order.orderItems.length > 0) {
          for (const item of order.orderItems) {
            await this.reduceStock(tx, item.productId, item.quantity, item.selectedVariantKey);
          }
        } else {
          await this.reduceStock(tx, order.productId, 1, order.selectedVariantKey);
        }
      }

      return { success: true };
    });
  }
}
