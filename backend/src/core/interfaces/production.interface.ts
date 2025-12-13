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
