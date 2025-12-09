"use strict";
/**
 * Production Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionService = void 0;
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
class ProductionService {
    repository;
    planRepository;
    stockRepository;
    constructor(repository, planRepository, stockRepository) {
        this.repository = repository;
        this.planRepository = planRepository;
        this.stockRepository = stockRepository;
    }
    async getApprovedPlans(filter) {
        try {
            const plans = await this.planRepository.findAllPlans({
                ...filter,
                status: 'APPROVED'
            });
            const dtos = plans.map((plan) => this.toPlanDto(plan));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PLANS_FETCH_ERROR',
                message: 'Onaylı planlar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async startProduction(planId, operatorId) {
        try {
            const plan = await this.planRepository.findPlanById(planId);
            if (!plan) {
                return (0, interfaces_1.failure)({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }
            if (plan.status !== 'APPROVED') {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS',
                    message: 'Sadece onaylı planlar üretime geçebilir'
                });
            }
            // Check if production already started
            const existingLog = await this.repository.findByPlanId(planId);
            if (existingLog && existingLog.status === 'STARTED') {
                return (0, interfaces_1.failure)({
                    code: 'PRODUCTION_IN_PROGRESS',
                    message: 'Bu plan için üretim zaten devam ediyor'
                });
            }
            // Create production log
            const log = await this.repository.create(planId, operatorId);
            // Update plan status
            await this.planRepository.updatePlanStatus(planId, 'IN_PRODUCTION');
            const fullLog = await this.repository.findById(log.id);
            // Publish production started event
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
            // Complete production
            await this.repository.complete(logId, data);
            // Update plan status
            await this.planRepository.updatePlanStatus(log.cuttingPlanId, 'COMPLETED');
            // Consume stock (create movements)
            await this.consumeStockForPlan(log.cuttingPlanId, logId);
            const completedLog = await this.repository.findById(logId);
            // Publish production completed event
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
    async consumeStockForPlan(planId, productionLogId) {
        const stockItems = await this.planRepository.getPlanStockItems(planId);
        for (const item of stockItems) {
            // Create consumption movement
            await this.stockRepository.createMovement({
                stockItemId: item.stockItemId,
                movementType: 'CONSUMPTION',
                quantity: 1, // Each stock item is consumed once
                notes: `Üretim planı: ${planId}`,
                productionLogId
            });
            // Update stock quantity
            await this.stockRepository.updateQuantity(item.stockItemId, -1);
        }
    }
    toPlanDto(plan) {
        return {
            id: plan.id,
            planNumber: plan.planNumber,
            scenarioId: plan.scenarioId,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            estimatedTime: plan.estimatedTime ?? undefined,
            estimatedCost: plan.estimatedCost ?? undefined,
            status: plan.status,
            layoutItems: []
        };
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