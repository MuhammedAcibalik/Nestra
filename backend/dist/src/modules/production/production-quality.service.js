"use strict";
/**
 * Production Quality Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for quality check operations only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionQualityService = void 0;
const interfaces_1 = require("../../core/interfaces");
const production_mapper_1 = require("./production.mapper");
/**
 * Production Quality Service Implementation
 */
class ProductionQualityService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async recordQualityCheck(input) {
        try {
            const qc = await this.repository.createQualityCheck(input);
            return (0, interfaces_1.success)((0, production_mapper_1.toQualityCheckDto)({ ...qc, inspector: null }));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'QC_RECORD_ERROR',
                message: 'Kalite kontrol kaydı oluşturulurken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getQualityChecks(logId) {
        try {
            const checks = await this.repository.findQualityChecksByLogId(logId);
            return (0, interfaces_1.success)(checks.map((c) => (0, production_mapper_1.toQualityCheckDto)(c)));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'QC_FETCH_ERROR',
                message: 'Kalite kontrol kayıtları getirilirken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
}
exports.ProductionQualityService = ProductionQualityService;
//# sourceMappingURL=production-quality.service.js.map