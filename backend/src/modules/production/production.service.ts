/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * Core production operations only - delegates downtime/quality to sub-services
 */

import {
    IProductionService,
    IProductionLogDto,
    IProductionPlanFilter,
    IProductionLogFilter,
    IUpdateProductionInput,
    ICompleteProductionInput,
    IMachineWorkFilter,
    IMachineWorkSummary,
    ICreateDowntimeInput,
    IDowntimeLogDto,
    ICreateQualityCheckInput,
    IQualityCheckDto,
    ICuttingPlanDto,
    IResult,
    success,
    failure
} from '../../core/interfaces';
import { IOptimizationServiceClient, IStockServiceClient } from '../../core/services';
import { IProductionRepository } from './production.repository';
import { EventBus, DomainEvents } from '../../core/events';
import { toProductionLogDto, getErrorMessage } from './production.mapper';
import { IProductionDowntimeService, ProductionDowntimeService } from './production-downtime.service';
import { IProductionQualityService, ProductionQualityService } from './production-quality.service';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('ProductionService');

export class ProductionService implements IProductionService {
    private readonly downtimeService: IProductionDowntimeService;
    private readonly qualityService: IProductionQualityService;

    constructor(
        private readonly repository: IProductionRepository,
        private readonly optimizationClient: IOptimizationServiceClient,
        private readonly stockClient: IStockServiceClient,
        downtimeService?: IProductionDowntimeService,
        qualityService?: IProductionQualityService
    ) {
        this.downtimeService = downtimeService ?? new ProductionDowntimeService(repository);
        this.qualityService = qualityService ?? new ProductionQualityService(repository);
    }

    // ==================== CORE PRODUCTION OPERATIONS ====================

    async getApprovedPlans(_filter?: IProductionPlanFilter): Promise<IResult<ICuttingPlanDto[]>> {
        try {
            const response = await this.optimizationClient.getApprovedPlans({
                scenarioId: _filter?.scenarioId,
                fromDate: _filter?.fromDate,
                toDate: _filter?.toDate
            });

            if (!response.success || !response.data) {
                return failure({
                    code: 'FETCH_ERROR',
                    message: 'Onaylı planlar getirilemedi'
                });
            }

            const plans: ICuttingPlanDto[] = response.data.map(plan => ({
                id: plan.id,
                planNumber: plan.planNumber,
                scenarioId: plan.scenarioId,
                totalWaste: plan.totalWaste,
                wastePercentage: plan.wastePercentage,
                stockUsedCount: plan.stockUsedCount,
                status: plan.status,
                layoutItems: []
            }));

            return success(plans);
        } catch (error) {
            return failure({
                code: 'APPROVED_PLANS_ERROR',
                message: 'Onaylı planlar getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async startProduction(planId: string, operatorId: string): Promise<IResult<IProductionLogDto>> {
        try {
            const planResponse = await this.optimizationClient.getPlanById(planId);

            if (!planResponse.success || !planResponse.data) {
                return failure({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }

            const plan = planResponse.data;

            if (plan.status !== 'APPROVED') {
                return failure({
                    code: 'INVALID_STATUS',
                    message: 'Sadece onaylı planlar üretime geçebilir'
                });
            }

            const existingLog = await this.repository.findByPlanId(planId);
            if (existingLog?.status === 'STARTED') {
                return failure({
                    code: 'PRODUCTION_IN_PROGRESS',
                    message: 'Bu plan için üretim zaten devam ediyor'
                });
            }

            const log = await this.repository.create(planId, operatorId);
            await this.optimizationClient.updatePlanStatus(planId, 'IN_PRODUCTION');
            const fullLog = await this.repository.findById(log.id);

            const eventBus = EventBus.getInstance();
            await eventBus.publish(DomainEvents.productionStarted({
                logId: log.id,
                planId: planId,
                planNumber: plan.planNumber,
                operatorId: operatorId
            }));

            return success(toProductionLogDto(fullLog!));
        } catch (error) {
            return failure({
                code: 'PRODUCTION_START_ERROR',
                message: 'Üretim başlatılırken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async updateProductionLog(logId: string, data: IUpdateProductionInput): Promise<IResult<IProductionLogDto>> {
        try {
            const log = await this.repository.findById(logId);

            if (!log) {
                return failure({
                    code: 'LOG_NOT_FOUND',
                    message: 'Üretim kaydı bulunamadı'
                });
            }

            if (log.status !== 'STARTED') {
                return failure({
                    code: 'INVALID_STATUS',
                    message: 'Sadece devam eden üretimler güncellenebilir'
                });
            }

            await this.repository.update(logId, {
                notes: data.notes,
                issues: data.issues ? { items: data.issues } : undefined
            });

            const updatedLog = await this.repository.findById(logId);
            return success(toProductionLogDto(updatedLog!));
        } catch (error) {
            return failure({
                code: 'PRODUCTION_UPDATE_ERROR',
                message: 'Üretim güncellenirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async completeProduction(logId: string, data: ICompleteProductionInput): Promise<IResult<IProductionLogDto>> {
        try {
            const log = await this.repository.findById(logId);

            if (!log) {
                return failure({
                    code: 'LOG_NOT_FOUND',
                    message: 'Üretim kaydı bulunamadı'
                });
            }

            if (log.status !== 'STARTED') {
                return failure({
                    code: 'INVALID_STATUS',
                    message: 'Sadece devam eden üretimler tamamlanabilir'
                });
            }

            await this.repository.complete(logId, data);
            await this.optimizationClient.updatePlanStatus(log.cuttingPlanId, 'COMPLETED');
            await this.consumeStockForPlan(log.cuttingPlanId, logId);

            const completedLog = await this.repository.findById(logId);

            const eventBus = EventBus.getInstance();
            await eventBus.publish(DomainEvents.productionCompleted({
                logId: logId,
                planId: log.cuttingPlanId,
                actualWaste: data.actualWaste,
                actualTime: data.actualTime
            }));

            return success(toProductionLogDto(completedLog!));
        } catch (error) {
            return failure({
                code: 'PRODUCTION_COMPLETE_ERROR',
                message: 'Üretim tamamlanırken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getProductionLogs(filter?: IProductionLogFilter): Promise<IResult<IProductionLogDto[]>> {
        try {
            const logs = await this.repository.findAll(filter);
            const dtos = logs.map((log) => toProductionLogDto(log));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'LOGS_FETCH_ERROR',
                message: 'Üretim kayıtları getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getMachineWorkSummary(_filter?: IMachineWorkFilter): Promise<IResult<IMachineWorkSummary[]>> {
        try {
            const logs = await this.repository.findAll({ status: 'COMPLETED' });

            const machineWorkMap = new Map<string, {
                machineId: string;
                machineName: string;
                machineCode: string;
                totalMinutes: number;
                logCount: number;
            }>();

            for (const log of logs) {
                if (!log.actualTime) continue;

                const planResult = await this.optimizationClient.getPlanById(log.cuttingPlanId);
                if (!planResult.success || !planResult.data?.assignedMachineId) continue;

                const machineId = planResult.data.assignedMachineId;
                const existing = machineWorkMap.get(machineId);

                if (existing) {
                    existing.totalMinutes += log.actualTime;
                    existing.logCount += 1;
                } else {
                    machineWorkMap.set(machineId, {
                        machineId,
                        machineName: planResult.data.assignedMachineName ?? 'Unknown',
                        machineCode: planResult.data.assignedMachineCode ?? machineId,
                        totalMinutes: log.actualTime,
                        logCount: 1
                    });
                }
            }

            const summaries: IMachineWorkSummary[] = Array.from(machineWorkMap.values()).map(entry => ({
                machineId: entry.machineId,
                machineName: entry.machineName,
                machineCode: entry.machineCode,
                totalWorkMinutes: entry.totalMinutes,
                totalWorkHours: Math.round((entry.totalMinutes / 60) * 100) / 100,
                completedLogs: entry.logCount,
                avgTimePerLog: entry.logCount > 0 ? Math.round(entry.totalMinutes / entry.logCount) : 0
            }));

            return success(summaries);
        } catch (error) {
            return failure({
                code: 'MACHINE_WORK_SUMMARY_ERROR',
                message: 'Makine çalışma özeti hesaplanırken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== STOCK CONSUMPTION ====================

    private async consumeStockForPlan(planId: string, productionLogId: string): Promise<void> {
        const items = await this.fetchPlanStockItems(planId);
        if (!items) return;

        const validItems = await this.validateStockItems(items);
        if (validItems.length === 0) return;

        const results = await this.processStockConsumption(validItems, planId, productionLogId);
        this.logConsumptionResults(results, items.length);
    }

    private async fetchPlanStockItems(planId: string) {
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

    private async validateStockItems(items: { stockItemId: string }[]): Promise<{ stockItemId: string }[]> {
        const validationErrors: string[] = [];

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

    private async processStockConsumption(
        items: { stockItemId: string }[],
        planId: string,
        productionLogId: string
    ): Promise<{ stockItemId: string; success: boolean }[]> {
        const results: { stockItemId: string; success: boolean }[] = [];

        for (const item of items) {
            const result = await this.consumeSingleStockItem(item.stockItemId, planId, productionLogId);
            results.push(result);
        }

        return results;
    }

    private async consumeSingleStockItem(
        stockItemId: string,
        planId: string,
        productionLogId: string
    ): Promise<{ stockItemId: string; success: boolean }> {
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
        } catch (error) {
            logger.error('Stock consumption failed', { stockItemId, error });
            return { stockItemId, success: false };
        }
    }

    private logConsumptionResults(results: { success: boolean; stockItemId: string }[], totalItems: number): void {
        const successCount = results.filter(r => r.success).length;
        const failedItems = results.filter(r => !r.success);

        if (failedItems.length > 0) {
            const failedIds = failedItems.map(f => f.stockItemId).join(', ');
            logger.warn('Partial stock consumption', { successCount, totalItems, failedIds });
        } else {
            logger.info('Stock consumption completed', { successCount });
        }
    }

    // ==================== DELEGATED OPERATIONS ====================

    async recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>> {
        return this.downtimeService.recordDowntime(input);
    }

    async endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>> {
        return this.downtimeService.endDowntime(downtimeId);
    }

    async getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>> {
        return this.downtimeService.getProductionDowntimes(logId);
    }

    async recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>> {
        return this.qualityService.recordQualityCheck(input);
    }

    async getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>> {
        return this.qualityService.getQualityChecks(logId);
    }
}
