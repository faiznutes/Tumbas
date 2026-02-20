"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const midtrans_service_1 = require("./midtrans.service");
const webhook_controller_1 = require("./webhook.controller");
const orders_module_1 = require("../orders/orders.module");
const prisma_module_1 = require("../prisma/prisma.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => orders_module_1.OrdersModule), prisma_module_1.PrismaModule],
        providers: [midtrans_service_1.MidtransService],
        controllers: [webhook_controller_1.WebhookController],
        exports: [midtrans_service_1.MidtransService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map