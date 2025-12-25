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
import { ScenarioController, createScenarioController } from './scenario.controller';
import { PlanController, createPlanController } from './plan.controller';

export class OptimizationController {
    public router: Router;
    private scenarioController: ScenarioController;
    private planController: PlanController;

    constructor(private readonly optimizationService: IOptimizationService) {
        this.router = Router();
        this.scenarioController = createScenarioController(optimizationService);
        this.planController = createPlanController(optimizationService);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Mount sub-controllers
        this.router.use('/scenarios', this.scenarioController.router);
        this.router.use('/plans', this.planController.router);
    }
}

export function createOptimizationController(optimizationService: IOptimizationService): OptimizationController {
    return new OptimizationController(optimizationService);
}

// Re-export sub-controllers for direct usage if needed
export { ScenarioController, createScenarioController } from './scenario.controller';
export { PlanController, createPlanController } from './plan.controller';
