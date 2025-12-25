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
import { Router } from 'express';
import { IOptimizationService } from '../../core/interfaces';
export declare class OptimizationController {
    private readonly optimizationService;
    router: Router;
    private scenarioController;
    private planController;
    constructor(optimizationService: IOptimizationService);
    private initializeRoutes;
}
export declare function createOptimizationController(optimizationService: IOptimizationService): OptimizationController;
export { ScenarioController, createScenarioController } from './scenario.controller';
export { PlanController, createPlanController } from './plan.controller';
//# sourceMappingURL=optimization.controller.d.ts.map