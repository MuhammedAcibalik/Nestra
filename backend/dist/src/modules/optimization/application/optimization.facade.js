"use strict";
/**
 * Optimization Facade
 * Main entry point for optimization operations
 * Following Facade Pattern - Simplifies complex subsystem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationFacade = void 0;
// Use existing engine
const optimization_engine_1 = require("../optimization.engine");
const optimization_validator_1 = require("./optimization.validator");
const websocket_1 = require("../../../websocket");
class OptimizationFacade {
    repository;
    engine;
    validator;
    constructor(repository, cuttingJobClient, stockQueryClient) {
        this.repository = repository;
        this.engine = new optimization_engine_1.OptimizationEngine(cuttingJobClient, stockQueryClient);
        this.validator = new optimization_validator_1.OptimizationValidator();
    }
    // ==================== SCENARIO OPERATIONS ====================
    async createScenario(data, userId) {
        try {
            if (!data.name || data.name.trim() === '') {
                return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Scenario name is required' } };
            }
            if (!data.cuttingJobId) {
                return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cutting job ID is required' } };
            }
            // Convert to proper input type
            const createInput = {
                name: data.name,
                cuttingJobId: data.cuttingJobId,
                parameters: (data.parameters ?? {}),
                useWarehouseStock: data.useWarehouseStock,
                useStandardSizes: data.useStandardSizes,
                selectedStockIds: data.selectedStockIds
            };
            const scenario = await this.repository.createScenario(createInput, userId);
            const fullScenario = await this.repository.findScenarioById(scenario.id);
            return {
                success: true,
                data: this.toScenarioDto(fullScenario)
            };
        }
        catch (error) {
            return this.handleError(error, 'CREATE_SCENARIO_ERROR');
        }
    }
    async getScenarios(filter) {
        try {
            const scenarios = await this.repository.findAllScenarios(filter);
            return {
                success: true,
                data: scenarios.map(s => this.toScenarioDto(s))
            };
        }
        catch (error) {
            return this.handleError(error, 'GET_SCENARIOS_ERROR');
        }
    }
    async getScenarioById(id) {
        try {
            const scenario = await this.repository.findScenarioById(id);
            if (!scenario) {
                return { success: false, error: { code: 'NOT_FOUND', message: 'Scenario not found' } };
            }
            return { success: true, data: this.toScenarioDto(scenario) };
        }
        catch (error) {
            return this.handleError(error, 'GET_SCENARIO_ERROR');
        }
    }
    // ==================== OPTIMIZATION EXECUTION ====================
    async runOptimization(scenarioId) {
        try {
            // Get scenario
            const scenario = await this.repository.findScenarioById(scenarioId);
            if (!scenario) {
                return { success: false, error: { code: 'NOT_FOUND', message: 'Scenario not found' } };
            }
            // Update status
            await this.repository.updateScenarioStatus(scenarioId, 'RUNNING');
            // Emit start event
            websocket_1.websocketService.emitOptimizationStarted({
                scenarioId,
                scenarioName: scenario.name,
                cuttingJobId: scenario.cuttingJobId,
                startedAt: new Date()
            });
            // Extract parameters
            const params = this.parseParameters(scenario);
            // Run optimization
            const startTime = Date.now();
            const output = await this.engine.runOptimization({
                cuttingJobId: scenario.cuttingJobId,
                scenarioId,
                parameters: params
            });
            if (!output.success || !output.planData) {
                await this.repository.updateScenarioStatus(scenarioId, 'FAILED');
                websocket_1.websocketService.emitOptimizationFailed({
                    scenarioId,
                    error: output.error ?? 'Optimization failed',
                    failedAt: new Date()
                });
                return {
                    success: false,
                    error: { code: 'OPTIMIZATION_FAILED', message: output.error ?? 'Optimization failed' }
                };
            }
            // Create plan
            const plan = await this.repository.createPlan(scenarioId, {
                totalWaste: output.planData.totalWaste,
                wastePercentage: output.planData.wastePercentage,
                stockUsedCount: output.planData.stockUsedCount,
                layoutData: output.planData.layouts
            });
            // Update status
            await this.repository.updateScenarioStatus(scenarioId, 'COMPLETED');
            // Emit completion
            websocket_1.websocketService.emitOptimizationCompleted({
                scenarioId,
                planId: plan.id,
                planNumber: plan.planNumber,
                totalWaste: output.planData.totalWaste,
                wastePercentage: output.planData.wastePercentage,
                stockUsedCount: output.planData.stockUsedCount,
                completedAt: new Date()
            });
            return {
                success: true,
                data: {
                    success: true,
                    planId: plan.id,
                    planNumber: plan.planNumber,
                    wastePercentage: output.planData.wastePercentage,
                    efficiency: output.planData.efficiency,
                    stockUsed: output.planData.stockUsedCount,
                    unplacedCount: output.planData.unplacedCount,
                    executionTimeMs: Date.now() - startTime
                }
            };
        }
        catch (error) {
            await this.repository.updateScenarioStatus(scenarioId, 'FAILED');
            return this.handleError(error, 'RUN_OPTIMIZATION_ERROR');
        }
    }
    // ==================== PLAN OPERATIONS ====================
    async getPlans(filter) {
        try {
            const plans = await this.repository.findAllPlans(filter);
            const planDtos = await Promise.all(plans.map(p => this.toPlanDto(p)));
            return { success: true, data: planDtos };
        }
        catch (error) {
            return this.handleError(error, 'GET_PLANS_ERROR');
        }
    }
    async getPlanById(id) {
        try {
            const plan = await this.repository.findPlanById(id);
            if (!plan) {
                return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };
            }
            return { success: true, data: await this.toPlanDto(plan) };
        }
        catch (error) {
            return this.handleError(error, 'GET_PLAN_ERROR');
        }
    }
    async approvePlan(planId, userId, machineId) {
        try {
            const plan = await this.repository.findPlanById(planId);
            if (!plan) {
                return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };
            }
            if (plan.status !== 'DRAFT') {
                return { success: false, error: { code: 'INVALID_STATUS', message: 'Plan already approved or in production' } };
            }
            await this.repository.updatePlanStatus(planId, 'APPROVED', userId, machineId);
            const updatedPlan = await this.repository.findPlanById(planId);
            return { success: true, data: await this.toPlanDto(updatedPlan) };
        }
        catch (error) {
            return this.handleError(error, 'APPROVE_PLAN_ERROR');
        }
    }
    async comparePlans(planIds) {
        try {
            if (planIds.length < 2) {
                return { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least 2 plans required for comparison' } };
            }
            const plans = await Promise.all(planIds.map(id => this.repository.findPlanById(id)));
            const validPlans = plans.filter((p) => p !== null);
            if (validPlans.length < 2) {
                return { success: false, error: { code: 'NOT_FOUND', message: 'Not enough valid plans found' } };
            }
            // Sort by waste percentage (lower is better)
            validPlans.sort((a, b) => a.wastePercentage - b.wastePercentage);
            const comparisons = validPlans.map((plan, index) => ({
                planId: plan.id,
                planNumber: plan.planNumber,
                wastePercentage: plan.wastePercentage,
                stockUsedCount: plan.stockUsedCount,
                estimatedCost: plan.estimatedCost ?? undefined,
                efficiency: 100 - plan.wastePercentage,
                rank: index + 1
            }));
            return { success: true, data: comparisons };
        }
        catch (error) {
            return this.handleError(error, 'COMPARE_PLANS_ERROR');
        }
    }
    // ==================== PRIVATE HELPERS ====================
    parseParameters(scenario) {
        const params = scenario.parameters ?? {};
        return {
            algorithm: params.algorithm,
            kerf: typeof params.kerf === 'number' ? params.kerf : undefined,
            minUsableWaste: typeof params.minUsableWaste === 'number' ? params.minUsableWaste : undefined,
            allowRotation: typeof params.allowRotation === 'boolean' ? params.allowRotation : undefined,
            useWarehouseStock: scenario.useWarehouseStock,
            selectedStockIds: scenario.selectedStockIds
        };
    }
    toScenarioDto(scenario) {
        return {
            id: scenario.id,
            name: scenario.name,
            cuttingJobId: scenario.cuttingJobId,
            cuttingJobNumber: scenario.cuttingJob?.jobNumber,
            status: scenario.status,
            parameters: scenario.parameters,
            resultCount: scenario._count?.results ?? 0,
            createdBy: scenario.createdBy
                ? `${scenario.createdBy.firstName} ${scenario.createdBy.lastName}`
                : undefined,
            createdAt: scenario.createdAt
        };
    }
    async toPlanDto(plan) {
        const stockItems = plan.stockUsed ?? await this.repository.getPlanStockItems(plan.id);
        return {
            id: plan.id,
            planNumber: plan.planNumber,
            scenarioId: plan.scenarioId,
            scenarioName: plan.scenario?.name,
            status: plan.status,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            estimatedTime: plan.estimatedTime ?? undefined,
            estimatedCost: plan.estimatedCost ?? undefined,
            layouts: stockItems.map(item => ({
                id: item.id,
                sequence: item.sequence,
                stockItemId: item.stockItemId,
                waste: item.waste,
                wastePercentage: item.wastePercentage,
                layoutData: this.parseLayoutData(item.layoutData)
            })),
            assignedMachine: plan.assignedMachine ?? undefined,
            approvedBy: plan.approvedBy
                ? `${plan.approvedBy.firstName} ${plan.approvedBy.lastName}`
                : undefined,
            approvedAt: plan.approvedAt ?? undefined,
            createdAt: plan.createdAt
        };
    }
    parseLayoutData(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            }
            catch {
                return { type: '1D', stockLength: 0, cuts: [] };
            }
        }
        return data;
    }
    handleError(error, code) {
        console.error(`[OptimizationFacade] ${code}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: { code, message } };
    }
}
exports.OptimizationFacade = OptimizationFacade;
//# sourceMappingURL=optimization.facade.js.map