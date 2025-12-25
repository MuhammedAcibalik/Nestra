/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * Core production operations only - delegates downtime/quality to sub-services
 */
import { IProductionService, IProductionLogDto, IProductionPlanFilter, IProductionLogFilter, IUpdateProductionInput, ICompleteProductionInput, IMachineWorkFilter, IMachineWorkSummary, ICreateDowntimeInput, IDowntimeLogDto, ICreateQualityCheckInput, IQualityCheckDto, ICuttingPlanDto, IResult } from '../../core/interfaces';
import { IOptimizationServiceClient, IStockServiceClient } from '../../core/services';
import { IProductionRepository } from './production.repository';
import { IProductionDowntimeService } from './production-downtime.service';
import { IProductionQualityService } from './production-quality.service';
export declare class ProductionService implements IProductionService {
    private readonly repository;
    private readonly optimizationClient;
    private readonly stockClient;
    private readonly downtimeService;
    private readonly qualityService;
    constructor(repository: IProductionRepository, optimizationClient: IOptimizationServiceClient, stockClient: IStockServiceClient, downtimeService?: IProductionDowntimeService, qualityService?: IProductionQualityService);
    getApprovedPlans(_filter?: IProductionPlanFilter): Promise<IResult<ICuttingPlanDto[]>>;
    startProduction(planId: string, operatorId: string): Promise<IResult<IProductionLogDto>>;
    updateProductionLog(logId: string, data: IUpdateProductionInput): Promise<IResult<IProductionLogDto>>;
    completeProduction(logId: string, data: ICompleteProductionInput): Promise<IResult<IProductionLogDto>>;
    getProductionLogs(filter?: IProductionLogFilter): Promise<IResult<IProductionLogDto[]>>;
    getMachineWorkSummary(_filter?: IMachineWorkFilter): Promise<IResult<IMachineWorkSummary[]>>;
    private consumeStockForPlan;
    private fetchPlanStockItems;
    private validateStockItems;
    private processStockConsumption;
    private consumeSingleStockItem;
    private logConsumptionResults;
    recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>>;
    endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>>;
    getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>>;
    recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>>;
    getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>>;
}
//# sourceMappingURL=production.service.d.ts.map