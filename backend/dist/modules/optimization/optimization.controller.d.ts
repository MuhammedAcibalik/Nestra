/**
 * Optimization Controller
 * Following SRP - Only handles HTTP concerns
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IOptimizationService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
export declare class OptimizationController {
    private readonly optimizationService;
    router: Router;
    constructor(optimizationService: IOptimizationService);
    private initializeRoutes;
    getScenarios(req: Request, res: Response, next: NextFunction): Promise<void>;
    getScenarioById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createScenario(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    runOptimization(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPlanById(req: Request, res: Response, next: NextFunction): Promise<void>;
    approvePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    comparePlans(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createOptimizationController(optimizationService: IOptimizationService): OptimizationController;
//# sourceMappingURL=optimization.controller.d.ts.map