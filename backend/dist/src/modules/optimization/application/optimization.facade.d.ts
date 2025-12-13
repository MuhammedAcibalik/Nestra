/**
 * Optimization Facade
 * Main entry point for optimization operations
 * Following Facade Pattern - Simplifies complex subsystem
 */
import { IResult } from '../../../core/interfaces';
import { IScenarioDto, ICuttingPlanDto, IOptimizationResultDto, IPlanComparisonDto, IScenarioFilterDto, IPlanFilterDto } from '../interfaces';
import { ICuttingJobServiceClient, IStockQueryClient } from '../../../core/services';
import { IOptimizationRepository } from '../optimization.repository';
export declare class OptimizationFacade {
    private readonly repository;
    private readonly engine;
    private readonly validator;
    constructor(repository: IOptimizationRepository, cuttingJobClient: ICuttingJobServiceClient, stockQueryClient: IStockQueryClient);
    createScenario(data: {
        name: string;
        cuttingJobId: string;
        parameters?: object;
        useWarehouseStock?: boolean;
        useStandardSizes?: boolean;
        selectedStockIds?: string[];
    }, userId: string): Promise<IResult<IScenarioDto>>;
    getScenarios(filter?: IScenarioFilterDto): Promise<IResult<IScenarioDto[]>>;
    getScenarioById(id: string): Promise<IResult<IScenarioDto>>;
    runOptimization(scenarioId: string): Promise<IResult<IOptimizationResultDto>>;
    getPlans(filter?: IPlanFilterDto): Promise<IResult<ICuttingPlanDto[]>>;
    getPlanById(id: string): Promise<IResult<ICuttingPlanDto>>;
    approvePlan(planId: string, userId: string, machineId?: string): Promise<IResult<ICuttingPlanDto>>;
    comparePlans(planIds: string[]): Promise<IResult<IPlanComparisonDto[]>>;
    private parseParameters;
    private toScenarioDto;
    private toPlanDto;
    private parseLayoutData;
    private handleError;
}
//# sourceMappingURL=optimization.facade.d.ts.map