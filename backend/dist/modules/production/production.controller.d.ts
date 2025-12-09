/**
 * Production Controller
 * Following SRP - Only handles HTTP concerns
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IProductionService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
export declare class ProductionController {
    private readonly productionService;
    router: Router;
    constructor(productionService: IProductionService);
    private initializeRoutes;
    getApprovedPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    getProductionLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLogById(req: Request, res: Response, next: NextFunction): Promise<void>;
    startProduction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateLog(req: Request, res: Response, next: NextFunction): Promise<void>;
    completeProduction(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createProductionController(productionService: IProductionService): ProductionController;
//# sourceMappingURL=production.controller.d.ts.map