"use strict";
/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * Core production operations only - delegates downtime/quality to sub-services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionService = void 0;
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
const production_mapper_1 = require("./production.mapper");
const production_downtime_service_1 = require("./production-downtime.service");
const production_quality_service_1 = require("./production-quality.service");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('ProductionService');
class ProductionService {
    repository;
    optimizationClient;
    stockClient;
    downtimeService;
    qualityService;
    constructor(repository, optimizationClient, stockClient, downtimeService, qualityService) {
        this.repository = repository;
        this.optimizationClient = optimizationClient;
        this.stockClient = stockClient;
        this.downtimeService = downtimeService ?? new production_downtime_service_1.ProductionDowntimeService(repository);
        this.qualityService = qualityService ?? new production_quality_service_1.ProductionQualityService(repository);
    }
    // ==================== CORE PRODUCTION OPERATIONS ====================
    async getApprovedPlans(_filter) {
        try {
            const response = await this.optimizationClient.getApprovedPlans({
                scenarioId: _filter?.scenarioId,
                fromDate: _filter?.fromDate,
                toDate: _filter?.toDate
            });
            if (!response.success || !response.data) {
                return (0, interfaces_1.failure)({
                    code: 'FETCH_ERROR',
                    message: 'Onaylı planlar getirilemedi'
                });
            }
            const plans = response.data.map(plan => ({
                id: plan.id,
                planNumber: plan.planNumber,
                scenarioId: plan.scenarioId,
                totalWaste: plan.totalWaste,
                wastePercentage: plan.wastePercentage,
                stockUsedCount: plan.stockUsedCount,
                status: plan.status,
                layoutItems: []
            }));
            return (0, interfaces_1.success)(plans);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'APPROVED_PLANS_ERROR',
                message: 'Onaylı planlar getirilirken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async startProduction(planId, operatorId) {
        try {
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
            const existingLog = await this.repository.findByPlanId(planId);
            if (existingLog?.status === 'STARTED') {
                return (0, interfaces_1.failure)({
                    code: 'PRODUCTION_IN_PROGRESS',
                    message: 'Bu plan için üretim zaten devam ediyor'
                });
            }
            const log = await this.repository.create(planId, operatorId);
            await this.optimizationClient.updatePlanStatus(planId, 'IN_PRODUCTION');
            const fullLog = await this.repository.findById(log.id);
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.productionStarted({
                logId: log.id,
                planId: planId,
                planNumber: plan.planNumber,
                operatorId: operatorId
            }));
            return (0, interfaces_1.success)((0, production_mapper_1.toProductionLogDto)(fullLog));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PRODUCTION_START_ERROR',
                message: 'Üretim başlatılırken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
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
                issues: data.issues ? { items: data.issues } : undefined
            });
            const updatedLog = await this.repository.findById(logId);
            return (0, interfaces_1.success)((0, production_mapper_1.toProductionLogDto)(updatedLog));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PRODUCTION_UPDATE_ERROR',
                message: 'Üretim güncellenirken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
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
            await this.repository.complete(logId, data);
            await this.optimizationClient.updatePlanStatus(log.cuttingPlanId, 'COMPLETED');
            await this.consumeStockForPlan(log.cuttingPlanId, logId);
            const completedLog = await this.repository.findById(logId);
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.productionCompleted({
                logId: logId,
                planId: log.cuttingPlanId,
                actualWaste: data.actualWaste,
                actualTime: data.actualTime
            }));
            return (0, interfaces_1.success)((0, production_mapper_1.toProductionLogDto)(completedLog));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PRODUCTION_COMPLETE_ERROR',
                message: 'Üretim tamamlanırken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getProductionLogs(filter) {
        try {
            const logs = await this.repository.findAll(filter);
            const dtos = logs.map((log) => (0, production_mapper_1.toProductionLogDto)(log));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOGS_FETCH_ERROR',
                message: 'Üretim kayıtları getirilirken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getMachineWorkSummary(_filter) {
        try {
            const logs = await this.repository.findAll({ status: 'COMPLETED' });
            const machineWorkMap = new Map();
            for (const log of logs) {
                if (!log.actualTime)
                    continue;
                const planResult = await this.optimizationClient.getPlanById(log.cuttingPlanId);
                if (!planResult.success || !planResult.data?.assignedMachineId)
                    continue;
                const machineId = planResult.data.assignedMachineId;
                const existing = machineWorkMap.get(machineId);
                if (existing) {
                    existing.totalMinutes += log.actualTime;
                    existing.logCount += 1;
                }
                else {
                    machineWorkMap.set(machineId, {
                        machineId,
                        machineName: planResult.data.assignedMachineName ?? 'Unknown',
                        machineCode: planResult.data.assignedMachineCode ?? machineId,
                        totalMinutes: log.actualTime,
                        logCount: 1
                    });
                }
            }
            const summaries = Array.from(machineWorkMap.values()).map(entry => ({
                machineId: entry.machineId,
                machineName: entry.machineName,
                machineCode: entry.machineCode,
                totalWorkMinutes: entry.totalMinutes,
                totalWorkHours: Math.round((entry.totalMinutes / 60) * 100) / 100,
                completedLogs: entry.logCount,
                avgTimePerLog: entry.logCount > 0 ? Math.round(entry.totalMinutes / entry.logCount) : 0
            }));
            return (0, interfaces_1.success)(summaries);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_WORK_SUMMARY_ERROR',
                message: 'Makine çalışma özeti hesaplanırken hata oluştu',
                details: { error: (0, production_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== STOCK CONSUMPTION ====================
    async consumeStockForPlan(planId, productionLogId) {
        const items = await this.fetchPlanStockItems(planId);
        if (!items)
            return;
        const validItems = await this.validateStockItems(items);
        if (validItems.length === 0)
            return;
        const results = await this.processStockConsumption(validItems, planId, productionLogId);
        this.logConsumptionResults(results, items.length);
    }
    async fetchPlanStockItems(planId) {
        const response = await this.optimizationClient.getPlanStockItems(planId);
        if (!response.success || !response.data) {
            logger.error('Failed to get plan stock items for consumption');
            return null;
        }
        if (response.data.length === 0) {
            logger.debug('No stock items to consume for plan', { planId });
            return null;
        }
        return response.data;
    }
    async validateStockItems(items) {
        const validationErrors = [];
        for (const item of items) {
            const stockCheck = await this.stockClient.getStockById(item.stockItemId);
            if (!stockCheck.success) {
                validationErrors.push(item.stockItemId);
            }
        }
        if (validationErrors.length > 0) {
            logger.warn('Stock validation failed', { failedItems: validationErrors });
        }
        return items.filter(i => !validationErrors.includes(i.stockItemId));
    }
    async processStockConsumption(items, planId, productionLogId) {
        const results = [];
        for (const item of items) {
            const result = await this.consumeSingleStockItem(item.stockItemId, planId, productionLogId);
            results.push(result);
        }
        return results;
    }
    async consumeSingleStockItem(stockItemId, planId, productionLogId) {
        try {
            const movementResponse = await this.stockClient.createMovement({
                stockItemId,
                movementType: 'CONSUMPTION',
                quantity: 1,
                notes: `Üretim planı: ${planId}`,
                productionLogId
            });
            if (!movementResponse.success) {
                return { stockItemId, success: false };
            }
            await this.stockClient.updateQuantity(stockItemId, -1);
            return { stockItemId, success: true };
        }
        catch (error) {
            logger.error('Stock consumption failed', { stockItemId, error });
            return { stockItemId, success: false };
        }
    }
    logConsumptionResults(results, totalItems) {
        const successCount = results.filter(r => r.success).length;
        const failedItems = results.filter(r => !r.success);
        if (failedItems.length > 0) {
            const failedIds = failedItems.map(f => f.stockItemId).join(', ');
            logger.warn('Partial stock consumption', { successCount, totalItems, failedIds });
        }
        else {
            logger.info('Stock consumption completed', { successCount });
        }
    }
    // ==================== DELEGATED OPERATIONS ====================
    async recordDowntime(input) {
        return this.downtimeService.recordDowntime(input);
    }
    async endDowntime(downtimeId) {
        return this.downtimeService.endDowntime(downtimeId);
    }
    async getProductionDowntimes(logId) {
        return this.downtimeService.getProductionDowntimes(logId);
    }
    async recordQualityCheck(input) {
        return this.qualityService.recordQualityCheck(input);
    }
    async getQualityChecks(logId) {
        return this.qualityService.getQualityChecks(logId);
    }
}
exports.ProductionService = ProductionService;
//# sourceMappingURL=production.service.js.map