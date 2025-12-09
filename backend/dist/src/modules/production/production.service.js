"use strict";
/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * NO cross-module repository dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionService = void 0;
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
class ProductionService {
    repository;
    optimizationClient;
    stockClient;
    constructor(repository, optimizationClient, stockClient) {
        this.repository = repository;
        this.optimizationClient = optimizationClient;
        this.stockClient = stockClient;
    }
    async getApprovedPlans(_filter) {
        // Note: For full microservice, this would call optimization service
        // Current limitation: we need a new method in optimization client
        return (0, interfaces_1.failure)({
            code: 'NOT_IMPLEMENTED',
            message: 'getApprovedPlans should call optimization service - requires additional endpoint'
        });
    }
    async startProduction(planId, operatorId) {
        try {
            // 1. Get plan from optimization service (cross-module via service client)
            const planResponse = await this.optimizationClient.getPlanById(planId);
            if (!planResponse.success || !planResponse.data) {
                return (0, interfaces_1.failure)({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }
            const plan = planResponse.data;
            if (plan.status !== 'APPROVED') {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS',
                    message: 'Sadece onaylı planlar üretime geçebilir'
                });
            }
            // 2. Check if production already started
            const existingLog = await this.repository.findByPlanId(planId);
            if (existingLog?.status === 'STARTED') {
                return (0, interfaces_1.failure)({
                    code: 'PRODUCTION_IN_PROGRESS',
                    message: 'Bu plan için üretim zaten devam ediyor'
                });
            }
            // 3. Create production log
            const log = await this.repository.create(planId, operatorId);
            // 4. Update plan status via service client
            await this.optimizationClient.updatePlanStatus(planId, 'IN_PRODUCTION');
            const fullLog = await this.repository.findById(log.id);
            // 5. Publish production started event
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.productionStarted({
                logId: log.id,
                planId: planId,
                planNumber: plan.planNumber,
                operatorId: operatorId
            }));
            return (0, interfaces_1.success)(this.toDto(fullLog));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PRODUCTION_START_ERROR',
                message: 'Üretim başlatılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateProductionLog(logId, data) {
        try {
            const log = await this.repository.findById(logId);
            if (!log) {
                return (0, interfaces_1.failure)({
                    code: 'LOG_NOT_FOUND',
                    message: 'Üretim kaydı bulunamadı'
                });
            }
            if (log.status !== 'STARTED') {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS',
                    message: 'Sadece devam eden üretimler güncellenebilir'
                });
            }
            await this.repository.update(logId, {
                notes: data.notes,
                issues: data.issues
            });
            const updatedLog = await this.repository.findById(logId);
            return (0, interfaces_1.success)(this.toDto(updatedLog));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PRODUCTION_UPDATE_ERROR',
                message: 'Üretim güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async completeProduction(logId, data) {
        try {
            const log = await this.repository.findById(logId);
            if (!log) {
                return (0, interfaces_1.failure)({
                    code: 'LOG_NOT_FOUND',
                    message: 'Üretim kaydı bulunamadı'
                });
            }
            if (log.status !== 'STARTED') {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS',
                    message: 'Sadece devam eden üretimler tamamlanabilir'
                });
            }
            // 1. Complete production log
            await this.repository.complete(logId, data);
            // 2. Update plan status via service client
            await this.optimizationClient.updatePlanStatus(log.cuttingPlanId, 'COMPLETED');
            // 3. Consume stock via service client
            await this.consumeStockForPlan(log.cuttingPlanId, logId);
            const completedLog = await this.repository.findById(logId);
            // 4. Publish production completed event
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.productionCompleted({
                logId: logId,
                planId: log.cuttingPlanId,
                actualWaste: data.actualWaste,
                actualTime: data.actualTime
            }));
            return (0, interfaces_1.success)(this.toDto(completedLog));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PRODUCTION_COMPLETE_ERROR',
                message: 'Üretim tamamlanırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getProductionLogs(filter) {
        try {
            const logs = await this.repository.findAll(filter);
            const dtos = logs.map((log) => this.toDto(log));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOGS_FETCH_ERROR',
                message: 'Üretim kayıtları getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    /**
     * Consume stock via service client - no direct repository access
     */
    async consumeStockForPlan(planId, productionLogId) {
        // Get stock items from optimization service
        const stockItemsResponse = await this.optimizationClient.getPlanStockItems(planId);
        if (!stockItemsResponse.success || !stockItemsResponse.data) {
            throw new Error('Failed to get plan stock items');
        }
        for (const item of stockItemsResponse.data) {
            // Create consumption movement via stock service
            await this.stockClient.createMovement({
                stockItemId: item.stockItemId,
                movementType: 'CONSUMPTION',
                quantity: 1,
                notes: `Üretim planı: ${planId}`,
                productionLogId
            });
            // Update stock quantity via stock service
            await this.stockClient.updateQuantity(item.stockItemId, -1);
        }
    }
    toDto(log) {
        return {
            id: log.id,
            cuttingPlanId: log.cuttingPlanId,
            planNumber: log.cuttingPlan?.planNumber ?? '',
            operatorName: log.operator
                ? `${log.operator.firstName} ${log.operator.lastName}`
                : '',
            status: log.status,
            actualWaste: log.actualWaste ?? undefined,
            actualTime: log.actualTime ?? undefined,
            startedAt: log.startedAt,
            completedAt: log.completedAt ?? undefined,
            notes: log.notes ?? undefined
        };
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.ProductionService = ProductionService;
//# sourceMappingURL=production.service.js.map