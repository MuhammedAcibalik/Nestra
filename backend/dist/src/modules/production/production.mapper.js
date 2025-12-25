"use strict";
/**
 * Production Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProductionLogDto = toProductionLogDto;
exports.toDowntimeDto = toDowntimeDto;
exports.toQualityCheckDto = toQualityCheckDto;
exports.getErrorMessage = getErrorMessage;
/**
 * Maps ProductionLog entity to DTO
 */
function toProductionLogDto(log) {
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
function toDowntimeDto(log) {
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
function toQualityCheckDto(qc) {
    return {
        id: qc.id,
        productionLogId: qc.productionLogId,
        result: qc.result,
        passedCount: qc.passedCount,
        failedCount: qc.failedCount,
        defectTypes: Array.isArray(qc.defectTypes) ? qc.defectTypes : undefined,
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
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
//# sourceMappingURL=production.mapper.js.map