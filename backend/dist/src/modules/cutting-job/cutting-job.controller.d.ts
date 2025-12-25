/**
 * CuttingJob Controller
 * Following SRP - Only handles HTTP request/response
 * @openapi
 * components:
 *   schemas:
 *     CuttingJob:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         jobNumber:
 *           type: string
 *           example: JOB-2024-001
 *         materialTypeId:
 *           type: string
 *           format: uuid
 *         thickness:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, READY, IN_PROGRESS, COMPLETED, CANCELLED]
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CuttingJobItem'
 *         totalPieces:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CuttingJobItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         orderItemId:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: integer
 *     CreateCuttingJobRequest:
 *       type: object
 *       required:
 *         - materialTypeId
 *         - thickness
 *       properties:
 *         materialTypeId:
 *           type: string
 *           format: uuid
 *         thickness:
 *           type: number
 *         notes:
 *           type: string
 */
import { Router, Request, Response } from 'express';
import { ICuttingJobService } from './cutting-job.service';
export declare class CuttingJobController {
    private readonly service;
    readonly router: Router;
    constructor(service: ICuttingJobService);
    private initializeRoutes;
    /**
     * @openapi
     * /cutting-jobs:
     *   get:
     *     tags: [CuttingJobs]
     *     summary: Kesim işlerini listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: status
     *         in: query
     *         schema:
     *           type: string
     *           enum: [PENDING, READY, IN_PROGRESS, COMPLETED, CANCELLED]
     *       - name: materialTypeId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: thickness
     *         in: query
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Kesim işleri listesi
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
     *                     $ref: '#/components/schemas/CuttingJob'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getJobs(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs/{id}:
     *   get:
     *     tags: [CuttingJobs]
     *     summary: Kesim işi detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Kesim işi detayı
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/CuttingJob'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getJobById(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs:
     *   post:
     *     tags: [CuttingJobs]
     *     summary: Yeni kesim işi oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCuttingJobRequest'
     *     responses:
     *       201:
     *         description: Kesim işi oluşturuldu
     *       400:
     *         description: Geçersiz istek
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    createJob(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs/auto-generate:
     *   post:
     *     tags: [CuttingJobs]
     *     summary: Siparişlerden otomatik kesim işi oluştur
     *     description: Onaylanmış siparişlerden otomatik olarak kesim işleri üretir
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               confirmedOnly:
     *                 type: boolean
     *                 default: true
     *                 description: Sadece onaylanmış siparişlerden üret
     *     responses:
     *       201:
     *         description: Kesim işleri oluşturuldu
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    autoGenerate(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs/{id}/status:
     *   patch:
     *     tags: [CuttingJobs]
     *     summary: Kesim işi durumunu güncelle
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
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [PENDING, READY, IN_PROGRESS, COMPLETED, CANCELLED]
     *     responses:
     *       200:
     *         description: Durum güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    updateStatus(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs/{id}/items:
     *   post:
     *     tags: [CuttingJobs]
     *     summary: Kesim işine kalem ekle
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
     *             required:
     *               - orderItemId
     *               - quantity
     *             properties:
     *               orderItemId:
     *                 type: string
     *                 format: uuid
     *               quantity:
     *                 type: integer
     *                 minimum: 1
     *     responses:
     *       200:
     *         description: Kalem eklendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    addItem(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs/{id}/items/{orderItemId}:
     *   delete:
     *     tags: [CuttingJobs]
     *     summary: Kesim işinden kalem çıkar
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: orderItemId
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Kalem çıkarıldı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    removeItem(req: Request, res: Response): Promise<void>;
    /**
     * @openapi
     * /cutting-jobs/{id}:
     *   delete:
     *     tags: [CuttingJobs]
     *     summary: Kesim işini sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       204:
     *         description: Kesim işi silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    deleteJob(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=cutting-job.controller.d.ts.map