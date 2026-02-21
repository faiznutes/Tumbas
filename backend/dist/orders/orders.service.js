"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const midtrans_service_1 = require("../payments/midtrans.service");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let OrdersService = class OrdersService {
    prisma;
    midtransService;
    configService;
    constructor(prisma, midtransService, configService) {
        this.prisma = prisma;
        this.midtransService = midtransService;
        this.configService = configService;
    }
    createPublicToken(orderId) {
        const secret = this.configService.get('ORDER_PUBLIC_SECRET') || this.configService.get('JWT_SECRET') || 'change-me';
        return crypto.createHmac('sha256', secret).update(orderId).digest('hex');
    }
    createVerificationCode(orderCode) {
        const normalized = orderCode.toUpperCase();
        let acc = 0;
        for (let i = 0; i < normalized.length; i++) {
            acc = (acc + normalized.charCodeAt(i) * (i + 17)) % 99999999;
        }
        return `VRF-${String(acc).padStart(8, '0')}`;
    }
    createShippingResi(orderCode) {
        const compact = orderCode.replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase();
        return `TMB-RESI-${compact}`;
    }
    async findAll(params) {
        const { page = 1, limit = 20, status, search } = params;
        const skip = (page - 1) * limit;
        const where = {};
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
    async findById(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { product: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async findPublicById(id, token) {
        if (!token || token !== this.createPublicToken(id)) {
            throw new common_1.UnauthorizedException('Invalid order token');
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
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async markShippedToExpedition(id, data) {
        const expeditionResi = data.expeditionResi.trim();
        if (!expeditionResi) {
            throw new common_1.BadRequestException('Expedition resi is required');
        }
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.paymentStatus !== 'PAID') {
            throw new common_1.BadRequestException('Order must be paid before shipping confirmation');
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
    async verifyReceipt(receiptNo, verificationCode) {
        const trimmedReceipt = (receiptNo || '').trim().toUpperCase();
        const trimmedCode = (verificationCode || '').trim().toUpperCase();
        if (!trimmedReceipt.startsWith('RCPT-')) {
            return { valid: false, reason: 'invalid_receipt_format' };
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
            return { valid: false, reason: 'receipt_not_found' };
        }
        const expectedCode = this.createVerificationCode(order.orderCode);
        if (trimmedCode !== expectedCode) {
            return { valid: false, reason: 'verification_code_mismatch' };
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
    async verifyByResi(resi) {
        const normalizedResi = (resi || '').trim().toUpperCase();
        if (!normalizedResi.startsWith('TMB-RESI-')) {
            return { valid: false, reason: 'invalid_resi_format' };
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
        const matched = orders.find((order) => this.createShippingResi(order.orderCode) === normalizedResi);
        if (!matched) {
            return { valid: false, reason: 'resi_not_found' };
        }
        if (!matched.shippedToExpedition || !matched.expeditionResi) {
            return {
                valid: false,
                reason: 'not_shipped_to_expedition',
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
    async create(data) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId },
            });
            if (!product) {
                throw new common_1.NotFoundException('Product not found');
            }
            if (product.status !== 'AVAILABLE') {
                throw new common_1.BadRequestException('Product is not available');
            }
            const pendingOrders = await tx.order.count({
                where: {
                    productId: data.productId,
                    paymentStatus: 'PENDING',
                },
            });
            if (pendingOrders > 0) {
                throw new common_1.BadRequestException('There is already a pending order for this product');
            }
            const orderCode = `TMB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const shippingCost = Math.max(0, data.shippingCost ?? 15000);
            const amount = product.price + shippingCost;
            const shippingNote = [
                data.shippingProvider ? `Courier: ${data.shippingProvider}` : null,
                data.shippingRegion ? `Region: ${data.shippingRegion}` : null,
                `Shipping: ${shippingCost}`,
            ]
                .filter(Boolean)
                .join(' | ');
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
                    notes: data.notes ? `${data.notes}\n${shippingNote}` : shippingNote,
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
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
        });
    }
    async updateStatus(id, status) {
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
    async handleWebhook(payload) {
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
            let paymentStatus = 'PENDING';
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        midtrans_service_1.MidtransService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], OrdersService);
//# sourceMappingURL=orders.service.js.map