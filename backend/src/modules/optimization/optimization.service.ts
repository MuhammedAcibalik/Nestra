import {
    IOptimizationService,
    IScenarioDto,
    IOptimizationResultDto,
    ICuttingPlanDto,
    ICuttingLayoutDto,
    IPlanComparisonDto,
    ICreateScenarioInput,
    IScenarioFilter,
    IPlanFilter,
    IOptimizationParameters,
    I1DLayoutData,
    I2DLayoutData,
    IResult,
    success,
    failure
} from '../../core/interfaces';
import { IOptimizationRepository, ScenarioWithRelations, PlanWithRelations } from './optimization.repository';
import { OptimizationEngine, OptimizationParameters } from './optimization.engine';
import { CuttingPlanStock } from '@prisma/client';
import { ICuttingJobServiceClient, IStockQueryClient } from '../../core/services';

export class OptimizationService implements IOptimizationService {
    private readonly engine: OptimizationEngine;

    constructor(
        private readonly repository: IOptimizationRepository,
        cuttingJobClient: ICuttingJobServiceClient,
        stockQueryClient: IStockQueryClient
    ) {
        this.engine = new OptimizationEngine(cuttingJobClient, stockQueryClient, {
            useWorkerThreads: true
        });
    }

    /**
     * Initialize worker pool - call at application startup
     */
    async initializeWorkers(): Promise<void> {
        await this.engine.initializeWorkers();
    }

    async createScenario(data: ICreateScenarioInput, userId: string): Promise<IResult<IScenarioDto>> {
        try {
            if (!data.name || !data.cuttingJobId) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Senaryo adı ve kesim işi zorunludur'
                });
            }

            const scenario = await this.repository.createScenario(data, userId);
            const fullScenario = await this.repository.findScenarioById(scenario.id);

            return success(this.toScenarioDto(fullScenario!));
        } catch (error) {
            return failure({
                code: 'SCENARIO_CREATE_ERROR',
                message: 'Senaryo oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getScenarios(filter?: IScenarioFilter): Promise<IResult<IScenarioDto[]>> {
        try {
            const scenarios = await this.repository.findAllScenarios(filter);
            const dtos = scenarios.map((s) => this.toScenarioDto(s));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'SCENARIO_FETCH_ERROR',
                message: 'Senaryolar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getScenarioById(id: string): Promise<IResult<IScenarioDto>> {
        try {
            const scenario = await this.repository.findScenarioById(id);

            if (!scenario) {
                return failure({
                    code: 'SCENARIO_NOT_FOUND',
                    message: 'Senaryo bulunamadı'
                });
            }

            return success(this.toScenarioDto(scenario));
        } catch (error) {
            return failure({
                code: 'SCENARIO_FETCH_ERROR',
                message: 'Senaryo getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async runOptimization(scenarioId: string): Promise<IResult<IOptimizationResultDto>> {
        try {
            // 1. Get scenario with parameters
            const scenario = await this.repository.findScenarioById(scenarioId);

            if (!scenario) {
                return failure({
                    code: 'SCENARIO_NOT_FOUND',
                    message: 'Senaryo bulunamadı'
                });
            }

            // 2. Mark as running
            await this.repository.updateScenarioStatus(scenarioId, 'RUNNING');

            // 3. Parse scenario parameters
            const params = this.parseScenarioParameters(scenario);

            // 4. Run optimization via engine
            const result = await this.engine.runOptimization({
                cuttingJobId: scenario.cuttingJobId,
                scenarioId: scenarioId,
                parameters: params
            });

            if (!result.success) {
                await this.repository.updateScenarioStatus(scenarioId, 'FAILED');
                return failure({
                    code: 'OPTIMIZATION_FAILED',
                    message: result.error ?? 'Optimizasyon başarısız',
                });
            }

            // 5. Create cutting plan with results
            const plan = await this.repository.createPlan(scenarioId, {
                totalWaste: result.planData.totalWaste,
                wastePercentage: result.planData.wastePercentage,
                stockUsedCount: result.planData.stockUsedCount,
                layoutData: result.planData.layouts.map(l => ({
                    stockItemId: l.stockItemId,
                    sequence: l.sequence,
                    waste: l.waste,
                    wastePercentage: l.wastePercentage,
                    layoutJson: l.layoutJson
                }))
            });

            // 6. Mark scenario as completed
            await this.repository.updateScenarioStatus(scenarioId, 'COMPLETED');

            return success({
                success: true,
                planId: plan.id,
                planNumber: plan.planNumber,
                totalWaste: result.planData.totalWaste,
                wastePercentage: result.planData.wastePercentage,
                stockUsedCount: result.planData.stockUsedCount,
                efficiency: result.planData.efficiency,
                unplacedCount: result.planData.unplacedCount
            });
        } catch (error) {
            await this.repository.updateScenarioStatus(scenarioId, 'FAILED');
            return failure({
                code: 'OPTIMIZATION_ERROR',
                message: 'Optimizasyon çalıştırılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private parseScenarioParameters(scenario: ScenarioWithRelations): OptimizationParameters {
        const rawParams = scenario.parameters as Record<string, unknown> | null;
        const constraints = rawParams?.constraints as Record<string, unknown> | undefined;

        return {
            algorithm: constraints?.algorithm as OptimizationParameters['algorithm'],
            kerf: typeof constraints?.kerf === 'number' ? constraints.kerf : undefined,
            minUsableWaste: typeof constraints?.minUsableWaste === 'number' ? constraints.minUsableWaste : undefined,
            allowRotation: typeof constraints?.allowRotation === 'boolean' ? constraints.allowRotation : undefined,
            useWarehouseStock: scenario.useWarehouseStock,
            selectedStockIds: scenario.selectedStockIds as string[] | undefined
        };
    }

    async getPlans(filter?: IPlanFilter): Promise<IResult<ICuttingPlanDto[]>> {
        try {
            const plans = await this.repository.findAllPlans(filter);
            const dtos = await Promise.all(plans.map((p) => this.toPlanDto(p)));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'PLAN_FETCH_ERROR',
                message: 'Kesim planları getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getPlanById(id: string): Promise<IResult<ICuttingPlanDto>> {
        try {
            const plan = await this.repository.findPlanById(id);

            if (!plan) {
                return failure({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }

            return success(await this.toPlanDto(plan));
        } catch (error) {
            return failure({
                code: 'PLAN_FETCH_ERROR',
                message: 'Kesim planı getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async approvePlan(planId: string, userId: string, machineId?: string): Promise<IResult<ICuttingPlanDto>> {
        try {
            const plan = await this.repository.findPlanById(planId);

            if (!plan) {
                return failure({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }

            if (plan.status !== 'DRAFT') {
                return failure({
                    code: 'INVALID_STATUS',
                    message: 'Sadece taslak durumundaki planlar onaylanabilir'
                });
            }

            await this.repository.updatePlanStatus(planId, 'APPROVED', userId, machineId);
            const updatedPlan = await this.repository.findPlanById(planId);

            return success(await this.toPlanDto(updatedPlan!));
        } catch (error) {
            return failure({
                code: 'PLAN_APPROVE_ERROR',
                message: 'Plan onaylanırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async comparePlans(planIds: string[]): Promise<IResult<IPlanComparisonDto[]>> {
        try {
            if (planIds.length < 2) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Karşılaştırma için en az 2 plan gerekli'
                });
            }

            const comparisons: IPlanComparisonDto[] = [];

            for (const planId of planIds) {
                const plan = await this.repository.findPlanById(planId);
                if (plan) {
                    comparisons.push({
                        id: plan.id,
                        planNumber: plan.planNumber,
                        scenarioName: plan.scenario?.name ?? '',
                        totalWaste: plan.totalWaste,
                        wastePercentage: plan.wastePercentage,
                        stockUsedCount: plan.stockUsedCount,
                        estimatedTime: plan.estimatedTime ?? undefined,
                        estimatedCost: plan.estimatedCost ?? undefined
                    });
                }
            }

            return success(comparisons);
        } catch (error) {
            return failure({
                code: 'COMPARISON_ERROR',
                message: 'Planlar karşılaştırılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toScenarioDto(scenario: ScenarioWithRelations): IScenarioDto {
        return {
            id: scenario.id,
            name: scenario.name,
            cuttingJobId: scenario.cuttingJobId,
            parameters: scenario.parameters as IOptimizationParameters,
            status: scenario.status,
            resultCount: scenario._count?.results ?? 0,
            createdAt: scenario.createdAt
        };
    }

    private async toPlanDto(plan: PlanWithRelations): Promise<ICuttingPlanDto> {
        const stockItems = plan.stockUsed ?? await this.repository.getPlanStockItems(plan.id);

        return {
            id: plan.id,
            planNumber: plan.planNumber,
            scenarioId: plan.scenarioId,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            estimatedTime: plan.estimatedTime ?? undefined,
            estimatedCost: plan.estimatedCost ?? undefined,
            status: plan.status,
            layoutItems: stockItems.map((item: CuttingPlanStock) => this.toLayoutDto(item))
        };
    }

    private toLayoutDto(item: CuttingPlanStock): ICuttingLayoutDto {
        const layoutData = this.parseLayoutData(item.layoutData);

        return {
            id: item.id,
            stockItemId: item.stockItemId,
            sequence: item.sequence,
            waste: item.waste,
            wastePercentage: item.wastePercentage,
            layoutData
        };
    }

    private parseLayoutData(data: unknown): I1DLayoutData | I2DLayoutData {
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return parsed as I1DLayoutData | I2DLayoutData;
            } catch {
                return { type: '1D', stockLength: 0, cuts: [] };
            }
        }
        if (typeof data === 'object' && data !== null) {
            return data as I1DLayoutData | I2DLayoutData;
        }
        return {
            type: '1D',
            stockLength: 0,
            cuts: []
        };
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
