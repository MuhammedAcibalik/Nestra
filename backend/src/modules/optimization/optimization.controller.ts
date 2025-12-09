/**
 * Optimization Controller
 * Following SRP - Only handles HTTP concerns
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IOptimizationService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class OptimizationController {
    public router: Router;

    constructor(private readonly optimizationService: IOptimizationService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
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

    public async getScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                cuttingJobId: req.query.cuttingJobId as string,
                status: req.query.status as string
            };

            const result = await this.optimizationService.getScenarios(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getScenarioById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.getScenarioById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async createScenario(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.createScenario(req.body, req.user!.userId);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async runOptimization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.runOptimization(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                scenarioId: req.query.scenarioId as string,
                status: req.query.status as string
            };

            const result = await this.optimizationService.getPlans(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.getPlanById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async approvePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { machineId } = req.body;
            const result = await this.optimizationService.approvePlan(
                req.params.id,
                req.user!.userId,
                machineId
            );

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async comparePlans(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { planIds } = req.body;
            const result = await this.optimizationService.comparePlans(planIds);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createOptimizationController(
    optimizationService: IOptimizationService
): OptimizationController {
    return new OptimizationController(optimizationService);
}
