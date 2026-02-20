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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const orders_service_1 = require("../orders/orders.service");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let WebhookController = class WebhookController {
    ordersService;
    prisma;
    configService;
    constructor(ordersService, prisma, configService) {
        this.ordersService = ordersService;
        this.prisma = prisma;
        this.configService = configService;
    }
    async handleMidtransWebhook(payload, signatureKey) {
        const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
        const expectedSignature = this.createSignature(payload.order_id, payload.status_code, payload.gross_amount, serverKey);
        const isValid = signatureKey === expectedSignature;
        const webhookLog = await this.prisma.webhookLog.create({
            data: {
                provider: 'midtrans',
                payload: {
                    ...payload,
                    processing: {
                        status: 'received',
                        attempts: 0,
                        receivedAt: new Date().toISOString(),
                    },
                },
                signature: signatureKey,
                isValid,
            },
        });
        if (!isValid) {
            await this.prisma.webhookLog.update({
                where: { id: webhookLog.id },
                data: {
                    payload: {
                        ...payload,
                        processing: {
                            status: 'invalid_signature',
                            attempts: 0,
                            receivedAt: new Date().toISOString(),
                        },
                    },
                },
            });
            console.error('[ALERT] Midtrans webhook invalid signature', {
                orderId: payload.order_id,
            });
            throw new common_1.UnauthorizedException('Invalid signature');
        }
        const maxRetries = parseInt(this.configService.get('WEBHOOK_MAX_RETRIES') || '3', 10);
        const retryDelayMs = parseInt(this.configService.get('WEBHOOK_RETRY_DELAY_MS') || '300', 10);
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.ordersService.handleWebhook({
                    order_id: payload.order_id,
                    transaction_status: payload.transaction_status,
                    transaction_id: payload.transaction_id,
                    status_code: payload.status_code,
                });
                const status = result.success ? 'processed' : 'processed_with_warning';
                await this.prisma.webhookLog.update({
                    where: { id: webhookLog.id },
                    data: {
                        payload: {
                            ...payload,
                            processing: {
                                status,
                                attempts: attempt,
                                receivedAt: new Date().toISOString(),
                                result,
                            },
                        },
                    },
                });
                if (!result.success) {
                    console.error('[ALERT] Midtrans webhook processed with warning', {
                        orderId: payload.order_id,
                        message: result.message,
                    });
                }
                return {
                    ...result,
                    attempts: attempt,
                };
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    await this.wait(retryDelayMs * attempt);
                    continue;
                }
            }
        }
        await this.prisma.webhookLog.update({
            where: { id: webhookLog.id },
            data: {
                payload: {
                    ...payload,
                    processing: {
                        status: 'failed',
                        attempts: maxRetries,
                        receivedAt: new Date().toISOString(),
                        error: lastError instanceof Error ? lastError.message : 'unknown_error',
                    },
                },
            },
        });
        console.error('[ALERT] Midtrans webhook failed after retries', {
            orderId: payload.order_id,
            retries: maxRetries,
        });
        throw new common_1.InternalServerErrorException('Webhook processing failed');
    }
    async getMidtransMonitor(minutes) {
        const durationMinutes = Math.max(parseInt(minutes || '60', 10) || 60, 1);
        const since = new Date(Date.now() - durationMinutes * 60_000);
        const logs = await this.prisma.webhookLog.findMany({
            where: {
                provider: 'midtrans',
                createdAt: {
                    gte: since,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 200,
        });
        const invalidSignature = logs.filter((log) => !log.isValid).length;
        const failed = logs.filter((log) => this.getProcessingStatus(log.payload) === 'failed').length;
        const warning = logs.filter((log) => this.getProcessingStatus(log.payload) === 'processed_with_warning').length;
        const processed = logs.filter((log) => this.getProcessingStatus(log.payload) === 'processed').length;
        const recentFailures = logs
            .filter((log) => ['failed', 'invalid_signature', 'processed_with_warning'].includes(this.getProcessingStatus(log.payload)))
            .slice(0, 20)
            .map((log) => {
            const payload = log.payload;
            return {
                id: log.id,
                createdAt: log.createdAt,
                orderId: payload?.order_id,
                status: this.getProcessingStatus(payload),
                attempts: payload?.processing?.attempts ?? 0,
                error: payload?.processing?.error ?? null,
            };
        });
        return {
            rangeMinutes: durationMinutes,
            since,
            summary: {
                totalReceived: logs.length,
                processed,
                warning,
                failed,
                invalidSignature,
            },
            recentFailures,
        };
    }
    createSignature(orderId, statusCode, grossAmount, serverKey) {
        const hash = crypto
            .createHash('sha512')
            .update(orderId + statusCode + grossAmount + serverKey)
            .digest('hex');
        return hash;
    }
    async wait(ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
    getProcessingStatus(payload) {
        if (!payload || typeof payload !== 'object')
            return 'unknown';
        const record = payload;
        return record?.processing?.status || 'unknown';
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('midtrans'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-signature-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleMidtransWebhook", null);
__decorate([
    (0, common_1.Get)('midtrans/monitor'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Query)('minutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "getMidtransMonitor", null);
exports.WebhookController = WebhookController = __decorate([
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map