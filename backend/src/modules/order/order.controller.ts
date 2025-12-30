/**
 * Order Controller
 * @openapi
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         orderNumber:
 *           type: string
 *           example: ORD-2024-001
 *         customerId:
 *           type: string
 *           format: uuid
 *         customerName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, IN_PLANNING, IN_PRODUCTION, COMPLETED, CANCELLED]
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         materialTypeId:
 *           type: string
 *           format: uuid
 *         geometryType:
 *           type: string
 *           enum: [BAR_1D, RECT_2D]
 *         thickness:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         length:
 *           type: number
 *         quantity:
 *           type: integer
 *         canRotate:
 *           type: boolean
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - customerId
 *       properties:
 *         customerId:
 *           type: string
 *           format: uuid
 *         notes:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *     OrderItemInput:
 *       type: object
 *       required:
 *         - materialTypeId
 *         - geometryType
 *         - thickness
 *         - quantity
 *       properties:
 *         materialTypeId:
 *           type: string
 *           format: uuid
 *         geometryType:
 *           type: string
 *           enum: [BAR_1D, RECT_2D]
 *         thickness:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         length:
 *           type: number
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         canRotate:
 *           type: boolean
 *           default: true
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { IOrderService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { validate, validateId } from '../../core/validation/middleware';
import { createOrderSchema, updateOrderSchema, orderItemSchema } from '../../core/validation/schemas';

const upload = multer({ storage: multer.memoryStorage() });

export class OrderController {
    public router: Router;

    constructor(private readonly orderService: IOrderService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', validateId(), this.getById.bind(this));
        this.router.post('/', validate(createOrderSchema), this.create.bind(this));
        this.router.put('/:id', validateId(), validate(updateOrderSchema), this.update.bind(this));
        this.router.delete('/:id', validateId(), this.delete.bind(this));
        this.router.post('/:id/items', validateId(), validate(orderItemSchema), this.addItem.bind(this));
        this.router.post('/import', upload.single('file'), this.importFromFile.bind(this));
    }

    /**
     * @openapi
     * /orders:
     *   get:
     *     tags: [Orders]
     *     summary: Siparişleri listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: status
     *         in: query
     *         schema:
     *           type: string
     *           enum: [DRAFT, CONFIRMED, IN_PLANNING, IN_PRODUCTION, COMPLETED, CANCELLED]
     *       - name: customerId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: startDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: endDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       200:
     *         description: Sipariş listesi
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Order'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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

    /**
     * @openapi
     * /orders/{id}:
     *   get:
     *     tags: [Orders]
     *     summary: Sipariş detayı getir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Sipariş detayı
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Order'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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

    /**
     * @openapi
     * /orders:
     *   post:
     *     tags: [Orders]
     *     summary: Yeni sipariş oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateOrderRequest'
     *     responses:
     *       201:
     *         description: Sipariş oluşturuldu
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Order'
     *       400:
     *         description: Geçersiz istek
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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

    /**
     * @openapi
     * /orders/{id}:
     *   put:
     *     tags: [Orders]
     *     summary: Sipariş güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [DRAFT, CONFIRMED, IN_PLANNING, IN_PRODUCTION, COMPLETED, CANCELLED]
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Sipariş güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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

    /**
     * @openapi
     * /orders/{id}:
     *   delete:
     *     tags: [Orders]
     *     summary: Sipariş sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Sipariş silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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

    /**
     * @openapi
     * /orders/{id}/items:
     *   post:
     *     tags: [Orders]
     *     summary: Siparişe kalem ekle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/OrderItemInput'
     *     responses:
     *       201:
     *         description: Kalem eklendi
     *       400:
     *         description: Geçersiz istek
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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

    /**
     * @openapi
     * /orders/import:
     *   post:
     *     tags: [Orders]
     *     summary: Dosyadan sipariş içe aktar
     *     description: Excel veya CSV dosyasından siparişleri içe aktarır
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - file
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *                 description: Excel veya CSV dosyası
     *               columnMapping:
     *                 type: string
     *                 description: JSON formatında kolon eşleştirmesi
     *     responses:
     *       201:
     *         description: İçe aktarma başarılı
     *       400:
     *         description: Dosya yüklenmedi veya format hatalı
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
