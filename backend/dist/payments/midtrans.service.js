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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidtransService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const midtrans_client_1 = __importDefault(require("midtrans-client"));
let MidtransService = class MidtransService {
    configService;
    snap;
    constructor(configService) {
        this.configService = configService;
        const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
        const isProduction = this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true';
        this.snap = new midtrans_client_1.default.Snap({
            isProduction,
            serverKey,
            clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
        });
    }
    async createTransaction(params) {
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
    verifySignature(signatureKey, orderId, statusCode, grossAmount) {
        const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
        const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
        const signature = crypto
            .createHash('sha512')
            .update(input)
            .digest('hex');
        return signature === signatureKey;
    }
};
exports.MidtransService = MidtransService;
exports.MidtransService = MidtransService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MidtransService);
//# sourceMappingURL=midtrans.service.js.map