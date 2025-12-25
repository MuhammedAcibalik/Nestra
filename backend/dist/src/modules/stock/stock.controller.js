"use strict";
/**
 * Stock Controller
 * Following SRP - Only handles HTTP concerns
 * @openapi
 * components:
 *   schemas:
 *     StockItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: STK-001
 *         name:
 *           type: string
 *         materialTypeId:
 *           type: string
 *           format: uuid
 *         stockType:
 *           type: string
 *           enum: [BAR_1D, SHEET_2D]
 *         length:
 *           type: number
 *           description: 1D çubuk uzunluğu (mm)
 *         width:
 *           type: number
 *           description: 2D levha genişliği (mm)
 *         height:
 *           type: number
 *           description: 2D levha yüksekliği (mm)
 *         thickness:
 *           type: number
 *         quantity:
 *           type: integer
 *         locationId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *     StockMovement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         stockItemId:
 *           type: string
 *           format: uuid
 *         movementType:
 *           type: string
 *           enum: [PURCHASE, CONSUMPTION, WASTE_REUSE, SCRAP, ADJUSTMENT, TRANSFER]
 *         quantity:
 *           type: integer
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateStockRequest:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - materialTypeId
 *         - stockType
 *         - quantity
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         materialTypeId:
 *           type: string
 *           format: uuid
 *         stockType:
 *           type: string
 *           enum: [BAR_1D, SHEET_2D]
 *         length:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         thickness:
 *           type: number
 *         quantity:
 *           type: integer
 *           minimum: 0
 *         locationId:
 *           type: string
 *           format: uuid
 *     CreateMovementRequest:
 *       type: object
 *       required:
 *         - stockItemId
 *         - movementType
 *         - quantity
 *       properties:
 *         stockItemId:
 *           type: string
 *           format: uuid
 *         movementType:
 *           type: string
 *           enum: [PURCHASE, CONSUMPTION, WASTE_REUSE, SCRAP, ADJUSTMENT, TRANSFER]
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         notes:
 *           type: string
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
exports.createStockController = createStockController;
const express_1 = require("express");
class StockController {
    stockService;
    router;
    constructor(stockService) {
        this.stockService = stockService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/movements', this.getMovements.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/movements', this.createMovement.bind(this));
    }
    /**
     * @openapi
     * /stock:
     *   get:
     *     tags: [Stock]
     *     summary: Stok kalemlerini listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: materialTypeId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: stockType
     *         in: query
     *         schema:
     *           type: string
     *           enum: [BAR_1D, SHEET_2D]
     *       - name: locationId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: minQuantity
     *         in: query
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Stok kalemleri listesi
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
     *                     $ref: '#/components/schemas/StockItem'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async getAll(req, res, next) {
        try {
            const filter = {
                materialTypeId: req.query.materialTypeId,
                stockType: req.query.stockType,
                locationId: req.query.locationId,
                minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined
            };
            const result = await this.stockService.getStockItems(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @openapi
     * /stock/{id}:
     *   get:
     *     tags: [Stock]
     *     summary: Stok kalemi detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Stok kalemi detayı
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/StockItem'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async getById(req, res, next) {
        try {
            const result = await this.stockService.getStockItemById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @openapi
     * /stock:
     *   post:
     *     tags: [Stock]
     *     summary: Yeni stok kalemi oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateStockRequest'
     *     responses:
     *       201:
     *         description: Stok kalemi oluşturuldu
     *       400:
     *         description: Geçersiz istek
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async create(req, res, next) {
        try {
            const result = await this.stockService.createStockItem(req.body);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @openapi
     * /stock/{id}:
     *   put:
     *     tags: [Stock]
     *     summary: Stok kalemi güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateStockRequest'
     *     responses:
     *       200:
     *         description: Stok kalemi güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async update(req, res, next) {
        try {
            const result = await this.stockService.updateStockItem(req.params.id, req.body);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @openapi
     * /stock/{id}:
     *   delete:
     *     tags: [Stock]
     *     summary: Stok kalemi sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Stok kalemi silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async delete(req, res, next) {
        try {
            const result = await this.stockService.deleteStockItem(req.params.id);
            if (result.success) {
                res.json({ success: true, message: 'Stok kalemi silindi' });
            }
            else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @openapi
     * /stock/movements:
     *   post:
     *     tags: [Stock]
     *     summary: Stok hareketi oluştur
     *     description: Satın alma, tüketim, fire vb. stok hareketleri kaydeder
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateMovementRequest'
     *     responses:
     *       201:
     *         description: Hareket oluşturuldu
     *       400:
     *         description: Geçersiz istek
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async createMovement(req, res, next) {
        try {
            const result = await this.stockService.createMovement(req.body);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @openapi
     * /stock/movements:
     *   get:
     *     tags: [Stock]
     *     summary: Stok hareketlerini listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: stockItemId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: movementType
     *         in: query
     *         schema:
     *           type: string
     *           enum: [PURCHASE, CONSUMPTION, WASTE_REUSE, SCRAP, ADJUSTMENT, TRANSFER]
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
     *         description: Stok hareketleri listesi
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
     *                     $ref: '#/components/schemas/StockMovement'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    async getMovements(req, res, next) {
        try {
            const filter = {
                stockItemId: req.query.stockItemId,
                movementType: req.query.movementType,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const result = await this.stockService.getMovements(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StockController = StockController;
function createStockController(stockService) {
    return new StockController(stockService);
}
//# sourceMappingURL=stock.controller.js.map