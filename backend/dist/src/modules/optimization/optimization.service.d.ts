import { IOptimizationService, IScenarioDto, IOptimizationResultDto, ICuttingPlanDto, IPlanComparisonDto, ICreateScenarioInput, IScenarioFilter, IPlanFilter, IResult } from '../../core/interfaces';
import { IOptimizationRepository } from './optimization.repository';
import { OptimizationEngine } from './optimization.engine';
import { ICuttingJobServiceClient, IStockQueryClient } from '../../core/services';
export declare class OptimizationService implements IOptimizationService {
    private readonly repository;
    private readonly engine;
    constructor(repository: IOptimizationRepository, cuttingJobClient: ICuttingJobServiceClient, stockQueryClient: IStockQueryClient);
    /**
     * Initialize worker pool - call at application startup
     */
    initializeWorkers(): Promise<void>;
    /**
     * Get engine instance for consumer registration
     */
    getEngine(): OptimizationEngine;
    createScenario(data: ICreateScenarioInput, userId: string): Promise<IResult<IScenarioDto>>;
    getScenarios(filter?: IScenarioFilter): Promise<IResult<IScenarioDto[]>>;
    getScenarioById(id: string): Promise<IResult<IScenarioDto>>;
    runOptimization(scenarioId: string): Promise<IResult<IOptimizationResultDto>>;
    private parseScenarioParameters;
    getPlans(filter?: IPlanFilter): Promise<IResult<ICuttingPlanDto[]>>;
    getPlanById(id: string): Promise<IResult<ICuttingPlanDto>>;
    approvePlan(planId: string, userId: string, machineId?: string): Promise<IResult<ICuttingPlanDto>>;
    comparePlans(planIds: string[]): Promise<IResult<IPlanComparisonDto[]>>;
    private toScenarioDto;
    private toPlanDto;
    private toLayoutDto;
    private parseLayoutData;
    private getErrorMessage;
}
//# sourceMappingURL=optimization.service.d.ts.map