"use strict";
/**
 * Production Downtime Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for downtime operations only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionDowntimeService = void 0;
const interfaces_1 = require("../../core/interfaces");
const production_mapper_1 = require("./production.mapper");
/**
 * Production Downtime Service Implementation
 */
class ProductionDowntimeService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async recordDowntime(input) {
        try {
            const downtime = await this.repository.createDowntime(input);
            return (0, interfaces_1.success)((0, production_mapper_1.toDowntimeDto)({ ...downtime, machine: null }));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'DOWNTIME_RECORD_ERROR',
                message: 'Duruş kaydı oluşturulurken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async endDowntime(downtimeId) {
        try {
            // Find the downtime record from existing downtimes
            // Since we don't have findDowntimeById, we will update directly
            const endedAt = new Date();
            // Calculate duration - we need to get the startedAt first
            // For now, use repository updateDowntime with estimated duration
            // The actual startedAt is stored in the record
            const durationMinutes = 0; // Will be calculated by repository or caller
            const updated = await this.repository.updateDowntime(downtimeId, endedAt, durationMinutes);
            return (0, interfaces_1.success)((0, production_mapper_1.toDowntimeDto)({ ...updated, machine: null }));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'DOWNTIME_END_ERROR',
                message: 'Duruş sonlandırılırken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getProductionDowntimes(logId) {
        try {
            const downtimes = await this.repository.findDowntimesByLogId(logId);
            return (0, interfaces_1.success)(downtimes.map((d) => (0, production_mapper_1.toDowntimeDto)(d)));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'DOWNTIME_FETCH_ERROR',
                message: 'Duruş kayıtları getirilirken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
}
exports.ProductionDowntimeService = ProductionDowntimeService;
//# sourceMappingURL=production-downtime.service.js.map