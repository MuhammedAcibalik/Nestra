/**
 * Production Service
 * Following SOLID principles with proper types
 */
import { IProductionService, IProductionLogDto, IProductionPlanFilter, IProductionLogFilter, IUpdateProductionInput, ICompleteProductionInput, ICuttingPlanDto, IResult } from '../../core/interfaces';
import { IProductionRepository } from './production.repository';
import { IOptimizationRepository } from '../optimization/optimization.repository';
import { IStockRepository } from '../stock/stock.repository';
export declare class ProductionService implements IProductionService {
    private readonly repository;
    private readonly planRepository;
    private readonly stockRepository;
    constructor(repository: IProductionRepository, planRepository: IOptimizationRepository, stockRepository: IStockRepository);
    getApprovedPlans(filter?: IProductionPlanFilter): Promise<IResult<ICuttingPlanDto[]>>;
    startProduction(planId: string, operatorId: string): Promise<IResult<IProductionLogDto>>;
    updateProductionLog(logId: string, data: IUpdateProductionInput): Promise<IResult<IProductionLogDto>>;
    completeProduction(logId: string, data: ICompleteProductionInput): Promise<IResult<IProductionLogDto>>;
    getProductionLogs(filter?: IProductionLogFilter): Promise<IResult<IProductionLogDto[]>>;
    private consumeStockForPlan;
    private toPlanDto;
    private toDto;
    private getErrorMessage;
}
//# sourceMappingURL=production.service.d.ts.map