"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const orders_service_1 = require("./orders.service");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
class CreateOrderDto {
    productId;
    customerName;
    customerEmail;
    customerPhone;
    customerAddress;
    customerCity;
    customerPostalCode;
    notes;
    shippingCost;
    shippingProvider;
    shippingRegion;
    shippingService;
    shippingEtd;
    shippingWeightGram;
    shippingDestinationCityId;
    selectedVariantKey;
    selectedVariantLabel;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerCity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerPostalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "shippingCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingProvider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingRegion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingService", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingEtd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "shippingWeightGram", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingDestinationCityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "selectedVariantKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "selectedVariantLabel", void 0);
class VerifyReceiptQueryDto {
    receiptNo;
    verificationCode;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyReceiptQueryDto.prototype, "receiptNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyReceiptQueryDto.prototype, "verificationCode", void 0);
class VerifyResiQueryDto {
    resi;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyResiQueryDto.prototype, "resi", void 0);
class MarkShippedDto {
    expeditionResi;
    expeditionName;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkShippedDto.prototype, "expeditionResi", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkShippedDto.prototype, "expeditionName", void 0);
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async findAll(page, limit, status, search) {
        return this.ordersService.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status,
            search,
        });
    }
    async verifyReceipt(query) {
        return this.ordersService.verifyReceipt(query.receiptNo, query.verificationCode);
    }
    async verifyResi(query) {
        return this.ordersService.verifyByResi(query.resi);
    }
    async findById(id) {
        return this.ordersService.findById(id);
    }
    async findPublicById(id, token) {
        return this.ordersService.findPublicById(id, token);
    }
    async create(dto) {
        return this.ordersService.create(dto);
    }
    async markShippedToExpedition(id, dto) {
        return this.ordersService.markShippedToExpedition(id, dto);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('verify-receipt'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyReceiptQueryDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "verifyReceipt", null);
__decorate([
    (0, common_1.Get)('verify-resi'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyResiQueryDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "verifyResi", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/public'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findPublicById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, common_1.Post)(':id/shipping/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MarkShippedDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "markShippedToExpedition", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map