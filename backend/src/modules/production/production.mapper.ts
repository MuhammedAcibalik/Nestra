/**
 * Production Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */

import { IProductionLogDto, IDowntimeLogDto, IQualityCheckDto } from '../../core/interfaces';
import { ProductionLogWithRelations, DowntimeLogWithRelations, QualityCheckWithRelations } from './production.repository';

/**
 * Maps ProductionLog entity to DTO
 */
export function toProductionLogDto(log: ProductionLogWithRelations): IProductionLogDto {
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

/**
 * Maps DowntimeLog entity to DTO
 */
export function toDowntimeDto(log: DowntimeLogWithRelations): IDowntimeLogDto {
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

/**
 * Maps QualityCheck entity to DTO
 */
export function toQualityCheckDto(qc: QualityCheckWithRelations): IQualityCheckDto {
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

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
