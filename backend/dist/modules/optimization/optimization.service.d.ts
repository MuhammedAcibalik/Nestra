/**
 * Optimization Service
 * Following SOLID principles with proper types
 */
import { IOptimizationService, IScenarioDto, IOptimizationResultDto, ICuttingPlanDto, IPlanComparisonDto, ICreateScenarioInput, IScenarioFilter, IPlanFilter, IResult } from '../../core/interfaces';
import { IOptimizationRepository } from './optimization.repository';
export declare class OptimizationService implements IOptimizationService {
    private readonly repository;
    constructor(repository: IOptimizationRepository);
    createScenario(data: ICreateScenarioInput, userId: string): Promise<IResult<IScenarioDto>>;
    getScenarios(filter?: IScenarioFilter): Promise<IResult<IScenarioDto[]>>;
    getScenarioById(id: string): Promise<IResult<IScenarioDto>>;
    runOptimization(scenarioId: string): Promise<IResult<IOptimizationResultDto>>;
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