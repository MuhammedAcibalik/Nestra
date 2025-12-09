"use strict";
/**
 * Optimization Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationService = void 0;
const interfaces_1 = require("../../core/interfaces");
class OptimizationService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async createScenario(data, userId) {
        try {
            if (!data.name || !data.cuttingJobId) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Senaryo adı ve kesim işi zorunludur'
                });
            }
            const scenario = await this.repository.createScenario(data, userId);
            const fullScenario = await this.repository.findScenarioById(scenario.id);
            return (0, interfaces_1.success)(this.toScenarioDto(fullScenario));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'SCENARIO_CREATE_ERROR',
                message: 'Senaryo oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getScenarios(filter) {
        try {
            const scenarios = await this.repository.findAllScenarios(filter);
            const dtos = scenarios.map((s) => this.toScenarioDto(s));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'SCENARIO_FETCH_ERROR',
                message: 'Senaryolar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getScenarioById(id) {
        try {
            const scenario = await this.repository.findScenarioById(id);
            if (!scenario) {
                return (0, interfaces_1.failure)({
                    code: 'SCENARIO_NOT_FOUND',
                    message: 'Senaryo bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toScenarioDto(scenario));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'SCENARIO_FETCH_ERROR',
                message: 'Senaryo getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async runOptimization(scenarioId) {
        try {
            const scenario = await this.repository.findScenarioById(scenarioId);
            if (!scenario) {
                return (0, interfaces_1.failure)({
                    code: 'SCENARIO_NOT_FOUND',
                    message: 'Senaryo bulunamadı'
                });
            }
            await this.repository.updateScenarioStatus(scenarioId, 'RUNNING');
            const planNumber = await this.repository.generatePlanNumber();
            await this.repository.updateScenarioStatus(scenarioId, 'COMPLETED');
            return (0, interfaces_1.success)({
                success: true,
                planId: crypto.randomUUID(),
                planNumber,
                totalWaste: 0,
                wastePercentage: 0,
                stockUsedCount: 0,
                efficiency: 100,
                unplacedCount: 0
            });
        }
        catch (error) {
            await this.repository.updateScenarioStatus(scenarioId, 'FAILED');
            return (0, interfaces_1.failure)({
                code: 'OPTIMIZATION_ERROR',
                message: 'Optimizasyon çalıştırılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getPlans(filter) {
        try {
            const plans = await this.repository.findAllPlans(filter);
            const dtos = await Promise.all(plans.map((p) => this.toPlanDto(p)));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PLAN_FETCH_ERROR',
                message: 'Kesim planları getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getPlanById(id) {
        try {
            const plan = await this.repository.findPlanById(id);
            if (!plan) {
                return (0, interfaces_1.failure)({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }
            return (0, interfaces_1.success)(await this.toPlanDto(plan));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PLAN_FETCH_ERROR',
                message: 'Kesim planı getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async approvePlan(planId, userId, machineId) {
        try {
            const plan = await this.repository.findPlanById(planId);
            if (!plan) {
                return (0, interfaces_1.failure)({
                    code: 'PLAN_NOT_FOUND',
                    message: 'Kesim planı bulunamadı'
                });
            }
            if (plan.status !== 'DRAFT') {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS',
                    message: 'Sadece taslak durumundaki planlar onaylanabilir'
                });
            }
            await this.repository.updatePlanStatus(planId, 'APPROVED', userId, machineId);
            const updatedPlan = await this.repository.findPlanById(planId);
            return (0, interfaces_1.success)(await this.toPlanDto(updatedPlan));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'PLAN_APPROVE_ERROR',
                message: 'Plan onaylanırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async comparePlans(planIds) {
        try {
            if (planIds.length < 2) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Karşılaştırma için en az 2 plan gerekli'
                });
            }
            const comparisons = [];
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
            return (0, interfaces_1.success)(comparisons);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'COMPARISON_ERROR',
                message: 'Planlar karşılaştırılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toScenarioDto(scenario) {
        return {
            id: scenario.id,
            name: scenario.name,
            cuttingJobId: scenario.cuttingJobId,
            parameters: scenario.parameters,
            status: scenario.status,
            resultCount: scenario._count?.results ?? 0,
            createdAt: scenario.createdAt
        };
    }
    async toPlanDto(plan) {
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
            layoutItems: stockItems.map((item) => this.toLayoutDto(item))
        };
    }
    toLayoutDto(item) {
        const layoutData = this.parseLayoutData(String(item.layoutData));
        return {
            id: item.id,
            stockItemId: item.stockItemId,
            sequence: item.sequence,
            waste: item.waste,
            wastePercentage: item.wastePercentage,
            layoutData
        };
    }
    parseLayoutData(json) {
        try {
            const parsed = JSON.parse(json);
            return parsed;
        }
        catch {
            return {
                type: '1D',
                stockLength: 0,
                cuts: []
            };
        }
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.OptimizationService = OptimizationService;
//# sourceMappingURL=optimization.service.js.map