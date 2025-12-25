/**
 * Production Module Interfaces
 */

import { IResult } from './result.interface';
import { ICuttingPlanDto } from './optimization.interface';

export interface IProductionService {
    getApprovedPlans(filter?: IProductionPlanFilter): Promise<IResult<ICuttingPlanDto[]>>;
    startProduction(planId: string, operatorId: string): Promise<IResult<IProductionLogDto>>;
    updateProductionLog(logId: string, data: IUpdateProductionInput): Promise<IResult<IProductionLogDto>>;
    completeProduction(logId: string, data: ICompleteProductionInput): Promise<IResult<IProductionLogDto>>;
    getProductionLogs(filter?: IProductionLogFilter): Promise<IResult<IProductionLogDto[]>>;
    getMachineWorkSummary(filter?: IMachineWorkFilter): Promise<IResult<IMachineWorkSummary[]>>;

    // Downtime tracking
    recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>>;
    endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>>;
    getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>>;

    // Quality control
    recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>>;
    getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>>;
}

export interface IProductionPlanFilter {
    status?: string;
    machineId?: string;
    scenarioId?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface IProductionLogFilter {
    status?: string;
    operatorId?: string;
    startDate?: Date;
    endDate?: Date;
}

/** Filter for machine work hours query */
export interface IMachineWorkFilter {
    machineId?: string;
    startDate?: Date;
    endDate?: Date;
}

/** Machine work hours summary */
export interface IMachineWorkSummary {
    machineId: string;
    machineName: string;
    machineCode: string;
    totalWorkMinutes: number;
    totalWorkHours: number;
    completedLogs: number;
    avgTimePerLog: number;
    idleMinutes?: number;
}

export interface IProductionLogDto {
    id: string;
    cuttingPlanId: string;
    planNumber: string;
    operatorName: string;
    status: string;
    actualWaste?: number;
    actualTime?: number;
    startedAt: Date;
    completedAt?: Date;
    notes?: string;
}

export interface IUpdateProductionInput {
    notes?: string;
    issues?: IProductionIssue[];
}

export interface IProductionIssue {
    description: string;
    severity: string;
}

export interface ICompleteProductionInput {
    actualWaste: number;
    actualTime: number;
    notes?: string;
}

// ==================== DOWNTIME INTERFACES ====================

/** Downtime reason codes */
export type DowntimeReason =
    | 'BREAKDOWN' // Arıza
    | 'MAINTENANCE' // Bakım
    | 'MATERIAL_WAIT' // Malzeme bekleme
    | 'TOOL_CHANGE' // Takım değişimi
    | 'OPERATOR_BREAK' // Operatör molası
    | 'SETUP' // Kurulum
    | 'OTHER'; // Diğer

/** Input for creating a downtime record */
export interface ICreateDowntimeInput {
    productionLogId: string;
    machineId?: string;
    reason: DowntimeReason;
    notes?: string;
}

/** Downtime log DTO */
export interface IDowntimeLogDto {
    id: string;
    productionLogId: string;
    machineId?: string;
    machineName?: string;
    reason: DowntimeReason;
    startedAt: Date;
    endedAt?: Date;
    durationMinutes?: number;
    notes?: string;
}

// ==================== QUALITY CONTROL INTERFACES ====================

/** Quality control result */
export type QcResult = 'PASS' | 'FAIL' | 'PARTIAL';

/** Input for creating a quality check */
export interface ICreateQualityCheckInput {
    productionLogId: string;
    result: QcResult;
    passedCount: number;
    failedCount: number;
    defectTypes?: string[];
    inspectorId?: string;
    notes?: string;
}

/** Quality check DTO */
export interface IQualityCheckDto {
    id: string;
    productionLogId: string;
    result: QcResult;
    passedCount: number;
    failedCount: number;
    defectTypes?: string[];
    inspectorId?: string;
    inspectorName?: string;
    checkedAt: Date;
    notes?: string;
}
