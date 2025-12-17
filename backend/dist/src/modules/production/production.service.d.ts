/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * NO cross-module repository dependencies
 */
import { IProductionService, IProductionLogDto, IProductionPlanFilter, IProductionLogFilter, IUpdateProductionInput, ICompleteProductionInput, IMachineWorkFilter, IMachineWorkSummary, ICreateDowntimeInput, IDowntimeLogDto, ICreateQualityCheckInput, IQualityCheckDto, ICuttingPlanDto, IResult } from '../../core/interfaces';
import { IOptimizationServiceClient, IStockServiceClient } from '../../core/services';
import { IProductionRepository } from './production.repository';
export declare class ProductionService implements IProductionService {
    private readonly repository;
    private readonly optimizationClient;
    private readonly stockClient;
    constructor(repository: IProductionRepository, optimizationClient: IOptimizationServiceClient, stockClient: IStockServiceClient);
    getApprovedPlans(_filter?: IProductionPlanFilter): Promise<IResult<ICuttingPlanDto[]>>;
    startProduction(planId: string, operatorId: string): Promise<IResult<IProductionLogDto>>;
    updateProductionLog(logId: string, data: IUpdateProductionInput): Promise<IResult<IProductionLogDto>>;
    completeProduction(logId: string, data: ICompleteProductionInput): Promise<IResult<IProductionLogDto>>;
    getProductionLogs(filter?: IProductionLogFilter): Promise<IResult<IProductionLogDto[]>>;
    getMachineWorkSummary(_filter?: IMachineWorkFilter): Promise<IResult<IMachineWorkSummary[]>>;
    /**
     * Consume stock via service client - no direct repository access
     * Uses Promise.allSettled for partial failure handling
     */
    private consumeStockForPlan;
    private toDto;
    private getErrorMessage;
    recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>>;
    endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>>;
    getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>>;
    private toDowntimeDto;
    recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>>;
    getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>>;
    private toQualityCheckDto;
}
//# sourceMappingURL=production.service.d.ts.map