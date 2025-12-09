/**
 * Stock Controller
 * Following SRP - Only handles HTTP concerns
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IStockService } from '../../core/interfaces';

export class StockController {
    public router: Router;

    constructor(private readonly stockService: IStockService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/movements', this.getMovements.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/movements', this.createMovement.bind(this));
    }

    private async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                materialTypeId: req.query.materialTypeId as string,
                stockType: req.query.stockType as 'BAR_1D' | 'SHEET_2D',
                locationId: req.query.locationId as string,
                minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined
            };

            const result = await this.stockService.getStockItems(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.stockService.getStockItemById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.stockService.createStockItem(req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.stockService.updateStockItem(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.stockService.deleteStockItem(req.params.id);

            if (result.success) {
                res.json({ success: true, message: 'Stok kalemi silindi' });
            } else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async createMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.stockService.createMovement(req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                stockItemId: req.query.stockItemId as string,
                movementType: req.query.movementType as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
            };

            const result = await this.stockService.getMovements(filter);

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

export function createStockController(stockService: IStockService): StockController {
    return new StockController(stockService);
}
