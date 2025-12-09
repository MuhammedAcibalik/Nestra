/**
 * Production Controller
 * Following SRP - Only handles HTTP concerns
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IProductionService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class ProductionController {
    public router: Router;

    constructor(private readonly productionService: IProductionService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/plans', this.getApprovedPlans.bind(this));
        this.router.get('/logs', this.getProductionLogs.bind(this));
        this.router.get('/logs/:id', this.getLogById.bind(this));
        this.router.post('/start/:planId', this.startProduction.bind(this));
        this.router.put('/logs/:id', this.updateLog.bind(this));
        this.router.post('/logs/:id/complete', this.completeProduction.bind(this));
    }

    public async getApprovedPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                status: req.query.status as string,
                machineId: req.query.machineId as string
            };

            const result = await this.productionService.getApprovedPlans(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getProductionLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                status: req.query.status as string,
                operatorId: req.query.operatorId as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
            };

            const result = await this.productionService.getProductionLogs(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const logs = await this.productionService.getProductionLogs({});
            const log = logs.data?.find((l) => l.id === req.params.id);

            if (log) {
                res.json({ success: true, data: log });
            } else {
                res.status(404).json({
                    success: false,
                    error: { code: 'LOG_NOT_FOUND', message: 'Üretim kaydı bulunamadı' }
                });
            }
        } catch (error) {
            next(error);
        }
    }

    public async startProduction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.productionService.startProduction(
                req.params.planId,
                req.user!.userId
            );

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.productionService.updateProductionLog(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'LOG_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async completeProduction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.productionService.completeProduction(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'LOG_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createProductionController(
    productionService: IProductionService
): ProductionController {
    return new ProductionController(productionService);
}
