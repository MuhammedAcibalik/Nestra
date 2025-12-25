"use strict";
/**
 * Optimization Controller
 * Following SRP - Composes scenario and plan sub-controllers
 *
 * @openapi
 * components:
 *   schemas:
 *     OptimizationScenario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, RUNNING, COMPLETED, FAILED]
 *         cuttingJobId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CuttingPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         planNumber:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, APPROVED, IN_PRODUCTION, COMPLETED]
 *         scenarioId:
 *           type: string
 *           format: uuid
 *         totalWaste:
 *           type: number
 *         wastePercentage:
 *           type: number
 *         totalStocks:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateScenarioRequest:
 *       type: object
 *       required:
 *         - name
 *         - cuttingJobId
 *       properties:
 *         name:
 *           type: string
 *         cuttingJobId:
 *           type: string
 *           format: uuid
 *         constraints:
 *           type: object
 *           properties:
 *             kerf:
 *               type: number
 *             minUsableWaste:
 *               type: number
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanController = exports.PlanController = exports.createScenarioController = exports.ScenarioController = exports.OptimizationController = void 0;
exports.createOptimizationController = createOptimizationController;
const express_1 = require("express");
const scenario_controller_1 = require("./scenario.controller");
const plan_controller_1 = require("./plan.controller");
class OptimizationController {
    optimizationService;
    router;
    scenarioController;
    planController;
    constructor(optimizationService) {
        this.optimizationService = optimizationService;
        this.router = (0, express_1.Router)();
        this.scenarioController = (0, scenario_controller_1.createScenarioController)(optimizationService);
        this.planController = (0, plan_controller_1.createPlanController)(optimizationService);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Mount sub-controllers
        this.router.use('/scenarios', this.scenarioController.router);
        this.router.use('/plans', this.planController.router);
    }
}
exports.OptimizationController = OptimizationController;
function createOptimizationController(optimizationService) {
    return new OptimizationController(optimizationService);
}
// Re-export sub-controllers for direct usage if needed
var scenario_controller_2 = require("./scenario.controller");
Object.defineProperty(exports, "ScenarioController", { enumerable: true, get: function () { return scenario_controller_2.ScenarioController; } });
Object.defineProperty(exports, "createScenarioController", { enumerable: true, get: function () { return scenario_controller_2.createScenarioController; } });
var plan_controller_2 = require("./plan.controller");
Object.defineProperty(exports, "PlanController", { enumerable: true, get: function () { return plan_controller_2.PlanController; } });
Object.defineProperty(exports, "createPlanController", { enumerable: true, get: function () { return plan_controller_2.createPlanController; } });
//# sourceMappingURL=optimization.controller.js.map