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
exports.ShippingController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const shipping_service_1 = require("./shipping.service");
class SearchCitiesQueryDto {
    q;
    limit;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchCitiesQueryDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], SearchCitiesQueryDto.prototype, "limit", void 0);
class ShippingRatesDto {
    destinationCityId;
    courier;
    weightGram;
    originCityId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingRatesDto.prototype, "destinationCityId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingRatesDto.prototype, "courier", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ShippingRatesDto.prototype, "weightGram", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingRatesDto.prototype, "originCityId", void 0);
let ShippingController = class ShippingController {
    shippingService;
    constructor(shippingService) {
        this.shippingService = shippingService;
    }
    async searchCities(query) {
        return this.shippingService.searchCities(query.q, query.limit);
    }
    async getRates(dto) {
        return this.shippingService.getRates(dto);
    }
};
exports.ShippingController = ShippingController;
__decorate([
    (0, common_1.Get)('cities'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchCitiesQueryDto]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "searchCities", null);
__decorate([
    (0, common_1.Post)('rates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ShippingRatesDto]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getRates", null);
exports.ShippingController = ShippingController = __decorate([
    (0, common_1.Controller)('shipping'),
    __metadata("design:paramtypes", [shipping_service_1.ShippingService])
], ShippingController);
//# sourceMappingURL=shipping.controller.js.map