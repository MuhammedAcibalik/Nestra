/**
 * Order Controller
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { IOrderService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

const upload = multer({ storage: multer.memoryStorage() });

export class OrderController {
    public router: Router;

    constructor(private readonly orderService: IOrderService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/:id/items', this.addItem.bind(this));
        this.router.post('/import', upload.single('file'), this.importFromFile.bind(this));
    }

    private async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                status: req.query.status as string,
                customerId: req.query.customerId as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
            };

            const result = await this.orderService.getOrders(filter);

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
            const result = await this.orderService.getOrderById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'ORDER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.orderService.createOrder(req.body, req.user!.userId);

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
            const result = await this.orderService.updateOrder(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'ORDER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.orderService.deleteOrder(req.params.id);

            if (result.success) {
                res.json({ success: true, message: 'Sipariş silindi' });
            } else {
                const status = result.error?.code === 'ORDER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.orderService.addOrderItem(req.params.id, req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async importFromFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: { code: 'NO_FILE', message: 'Dosya yüklenmedi' }
                });
                return;
            }

            const mapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : {};
            const result = await this.orderService.importFromFile(req.file.buffer, mapping, req.user!.userId);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createOrderController(orderService: IOrderService): OrderController {
    return new OrderController(orderService);
}
