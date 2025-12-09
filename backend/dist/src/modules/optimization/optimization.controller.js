"use strict";
/**
 * Optimization Controller
 * Following SRP - Only handles HTTP concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationController = void 0;
exports.createOptimizationController = createOptimizationController;
const express_1 = require("express");
class OptimizationController {
    optimizationService;
    router;
    constructor(optimizationService) {
        this.optimizationService = optimizationService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Scenarios
        this.router.get('/scenarios', this.getScenarios.bind(this));
        this.router.get('/scenarios/:id', this.getScenarioById.bind(this));
        this.router.post('/scenarios', this.createScenario.bind(this));
        this.router.post('/scenarios/:id/run', this.runOptimization.bind(this));
        // Plans
        this.router.get('/plans', this.getPlans.bind(this));
        this.router.get('/plans/:id', this.getPlanById.bind(this));
        this.router.post('/plans/:id/approve', this.approvePlan.bind(this));
        this.router.post('/plans/compare', this.comparePlans.bind(this));
    }
    async getScenarios(req, res, next) {
        try {
            const filter = {
                cuttingJobId: req.query.cuttingJobId,
                status: req.query.status
            };
            const result = await this.optimizationService.getScenarios(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getScenarioById(req, res, next) {
        try {
            const result = await this.optimizationService.getScenarioById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async createScenario(req, res, next) {
        try {
            const result = await this.optimizationService.createScenario(req.body, req.user.userId);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async runOptimization(req, res, next) {
        try {
            const result = await this.optimizationService.runOptimization(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getPlans(req, res, next) {
        try {
            const filter = {
                scenarioId: req.query.scenarioId,
                status: req.query.status
            };
            const result = await this.optimizationService.getPlans(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getPlanById(req, res, next) {
        try {
            const result = await this.optimizationService.getPlanById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async approvePlan(req, res, next) {
        try {
            const { machineId } = req.body;
            const result = await this.optimizationService.approvePlan(req.params.id, req.user.userId, machineId);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async comparePlans(req, res, next) {
        try {
            const { planIds } = req.body;
            const result = await this.optimizationService.comparePlans(planIds);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OptimizationController = OptimizationController;
function createOptimizationController(optimizationService) {
    return new OptimizationController(optimizationService);
}
//# sourceMappingURL=optimization.controller.js.map