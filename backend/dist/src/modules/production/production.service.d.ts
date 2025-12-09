/**
 * Production Service - Microservice Architecture
 * Following SOLID principles with proper service isolation
 * NO cross-module repository dependencies
 */
import { IProductionService, IProductionLogDto, IProductionPlanFilter, IProductionLogFilter, IUpdateProductionInput, ICompleteProductionInput, ICuttingPlanDto, IResult } from '../../core/interfaces';
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
    /**
     * Consume stock via service client - no direct repository access
     */
    private consumeStockForPlan;
    private toDto;
    private getErrorMessage;
}
//# sourceMappingURL=production.service.d.ts.map