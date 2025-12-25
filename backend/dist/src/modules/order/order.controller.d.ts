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
import { Router } from 'express';
import { IOrderService } from '../../core/interfaces';
export declare class OrderController {
    private readonly orderService;
    router: Router;
    constructor(orderService: IOrderService);
    private initializeRoutes;
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
    private getAll;
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
    private getById;
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
    private create;
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
    private update;
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
    private delete;
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
    private addItem;
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
    private importFromFile;
}
export declare function createOrderController(orderService: IOrderService): OrderController;
//# sourceMappingURL=order.controller.d.ts.map