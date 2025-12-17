/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * NO cross-module repository dependencies
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
import {
    IOptimizationServiceClient,
    IStockServiceClient
} from '../../core/services';
import { IProductionRepository, ProductionLogWithRelations, DowntimeLogWithRelations, QualityCheckWithRelations } from './production.repository';
import { EventBus, DomainEvents } from '../../core/events';

export class ProductionService implements IProductionService {
    constructor(
        private readonly repository: IProductionRepository,
        private readonly optimizationClient: IOptimizationServiceClient,
        private readonly stockClient: IStockServiceClient
    ) { }

    async getApprovedPlans(_filter?: IProductionPlanFilter): Promise<IResult<ICuttingPlanDto[]>> {
        try {
            // Call optimization service to get approved plans
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

            // Transform to ICuttingPlanDto format
            const plans: ICuttingPlanDto[] = response.data.map(plan => ({
                id: plan.id,
                planNumber: plan.planNumber,
                scenarioId: plan.scenarioId,
                totalWaste: plan.totalWaste,
                wastePercentage: plan.wastePercentage,
                stockUsedCount: plan.stockUsedCount,
                status: plan.status,
                layoutItems: [] // Layout items not needed for listing
            }));

            return success(plans);
        } catch (error) {
            return failure({
                code: 'APPROVED_PLANS_ERROR',
                message: 'Onaylı planlar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async startProduction(planId: string, operatorId: string): Promise<IResult<IProductionLogDto>> {
        try {
            // 1. Get plan from optimization service (cross-module via service client)
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

            // 2. Check if production already started
            const existingLog = await this.repository.findByPlanId(planId);
            if (existingLog?.status === 'STARTED') {
                return failure({
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
            const eventBus = EventBus.getInstance();
            await eventBus.publish(DomainEvents.productionStarted({
                logId: log.id,
                planId: planId,
                planNumber: plan.planNumber,
                operatorId: operatorId
            }));

            return success(this.toDto(fullLog!));
        } catch (error) {
            return failure({
                code: 'PRODUCTION_START_ERROR',
                message: 'Üretim başlatılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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
            return success(this.toDto(updatedLog!));
        } catch (error) {
            return failure({
                code: 'PRODUCTION_UPDATE_ERROR',
                message: 'Üretim güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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

            // 1. Complete production log
            await this.repository.complete(logId, data);

            // 2. Update plan status via service client
            await this.optimizationClient.updatePlanStatus(log.cuttingPlanId, 'COMPLETED');

            // 3. Consume stock via service client
            await this.consumeStockForPlan(log.cuttingPlanId, logId);

            const completedLog = await this.repository.findById(logId);

            // 4. Publish production completed event
            const eventBus = EventBus.getInstance();
            await eventBus.publish(DomainEvents.productionCompleted({
                logId: logId,
                planId: log.cuttingPlanId,
                actualWaste: data.actualWaste,
                actualTime: data.actualTime
            }));

            return success(this.toDto(completedLog!));
        } catch (error) {
            return failure({
                code: 'PRODUCTION_COMPLETE_ERROR',
                message: 'Üretim tamamlanırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getProductionLogs(filter?: IProductionLogFilter): Promise<IResult<IProductionLogDto[]>> {
        try {
            const logs = await this.repository.findAll(filter);
            const dtos = logs.map((log) => this.toDto(log));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'LOGS_FETCH_ERROR',
                message: 'Üretim kayıtları getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getMachineWorkSummary(_filter?: IMachineWorkFilter): Promise<IResult<IMachineWorkSummary[]>> {
        try {
            // Get all completed production logs
            const logs = await this.repository.findAll({ status: 'COMPLETED' });

            // Group by machine - for now, we'll aggregate by the plan's assigned machine
            // This requires data from the cutting plan which has machineId
            const machineWorkMap = new Map<string, {
                machineId: string;
                machineName: string;
                machineCode: string;
                totalMinutes: number;
                logCount: number;
            }>();

            for (const log of logs) {
                if (!log.actualTime) continue;

                // Get machine info from the cutting plan (via optimization client)
                const planId = log.cuttingPlanId;
                const planResult = await this.optimizationClient.getPlanById(planId);

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

            // Convert to result array
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
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    /**
     * Consume stock via service client - no direct repository access
     * Uses Promise.allSettled for partial failure handling
     */
    private async consumeStockForPlan(planId: string, productionLogId: string): Promise<void> {
        // Get stock items from optimization service
        const stockItemsResponse = await this.optimizationClient.getPlanStockItems(planId);

        if (!stockItemsResponse.success || !stockItemsResponse.data) {
            throw new Error('Failed to get plan stock items');
        }

        const items = stockItemsResponse.data;
        const consumptionResults: { stockItemId: string; success: boolean; error?: string }[] = [];

        // Process all items and track results
        const consumptionPromises = items.map(async (item) => {
            try {
                // Create consumption movement via stock service
                const movementResponse = await this.stockClient.createMovement({
                    stockItemId: item.stockItemId,
                    movementType: 'CONSUMPTION',
                    quantity: 1,
                    notes: `Üretim planı: ${planId}`,
                    productionLogId
                });

                if (!movementResponse.success) {
                    throw new Error(movementResponse.error?.message ?? 'Movement creation failed');
                }

                // Update stock quantity via stock service
                const quantityResponse = await this.stockClient.updateQuantity(item.stockItemId, -1);

                if (!quantityResponse.success) {
                    throw new Error(quantityResponse.error?.message ?? 'Quantity update failed');
                }

                return { stockItemId: item.stockItemId, success: true };
            } catch (error) {
                console.error(`[PRODUCTION] Stock consumption failed for ${item.stockItemId}:`, error);
                return {
                    stockItemId: item.stockItemId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // Wait for all with settled pattern (doesn't throw on individual failures)
        const results = await Promise.all(consumptionPromises);
        consumptionResults.push(...results);

        // Check for failures
        const failedItems = consumptionResults.filter(r => !r.success);
        if (failedItems.length > 0) {
            const failedIds = failedItems.map(f => f.stockItemId).join(', ');
            console.error(`[PRODUCTION] Partial stock consumption failure: ${failedIds}`);

            // If all failed, throw error
            if (failedItems.length === items.length) {
                throw new Error(`All stock consumptions failed: ${failedIds}`);
            }

            // Log warning for partial failure (production continues but needs attention)
            console.warn(`[PRODUCTION] ${failedItems.length}/${items.length} stock items failed to consume for plan ${planId}`);
        }
    }

    private toDto(log: ProductionLogWithRelations): IProductionLogDto {
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

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    // ==================== DOWNTIME METHODS ====================

    async recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>> {
        try {
            const downtime = await this.repository.createDowntime(input);
            return success(this.toDowntimeDto({ ...downtime, machine: null }));
        } catch (error) {
            return failure({
                code: 'DOWNTIME_RECORD_ERROR',
                message: 'Duruş kaydı oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>> {
        try {
            const endedAt = new Date();
            // Get original downtime to calculate duration
            const downtimes = await this.repository.findDowntimesByLogId('');
            const original = downtimes.find((d) => d.id === downtimeId);
            const durationMinutes = original
                ? (endedAt.getTime() - original.startedAt.getTime()) / 60000
                : 0;

            const updated = await this.repository.updateDowntime(downtimeId, endedAt, durationMinutes);
            return success(this.toDowntimeDto({ ...updated, machine: null }));
        } catch (error) {
            return failure({
                code: 'DOWNTIME_END_ERROR',
                message: 'Duruş kaydı sonlandırılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>> {
        try {
            const downtimes = await this.repository.findDowntimesByLogId(logId);
            return success(downtimes.map((d) => this.toDowntimeDto(d)));
        } catch (error) {
            return failure({
                code: 'DOWNTIME_FETCH_ERROR',
                message: 'Duruş kayıtları getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toDowntimeDto(log: DowntimeLogWithRelations): IDowntimeLogDto {
        return {
            id: log.id,
            productionLogId: log.productionLogId,
            machineId: log.machineId ?? undefined,
            machineName: log.machine?.name ?? undefined,
            reason: log.reason,
            startedAt: log.startedAt,
            endedAt: log.endedAt ?? undefined,
            durationMinutes: log.durationMinutes ?? undefined,
            notes: log.notes ?? undefined
        };
    }

    // ==================== QUALITY CHECK METHODS ====================

    async recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>> {
        try {
            const qc = await this.repository.createQualityCheck(input);
            return success(this.toQualityCheckDto({ ...qc, inspector: null }));
        } catch (error) {
            return failure({
                code: 'QC_RECORD_ERROR',
                message: 'Kalite kontrol kaydı oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>> {
        try {
            const checks = await this.repository.findQualityChecksByLogId(logId);
            return success(checks.map((c) => this.toQualityCheckDto(c)));
        } catch (error) {
            return failure({
                code: 'QC_FETCH_ERROR',
                message: 'Kalite kontrol kayıtları getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toQualityCheckDto(qc: QualityCheckWithRelations): IQualityCheckDto {
        return {
            id: qc.id,
            productionLogId: qc.productionLogId,
            result: qc.result,
            passedCount: qc.passedCount,
            failedCount: qc.failedCount,
            defectTypes: Array.isArray(qc.defectTypes) ? qc.defectTypes as string[] : undefined,
            inspectorId: qc.inspectorId ?? undefined,
            inspectorName: qc.inspector
                ? `${qc.inspector.firstName} ${qc.inspector.lastName}`
                : undefined,
            checkedAt: qc.checkedAt,
            notes: qc.notes ?? undefined
        };
    }
}
