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
import { ICuttingJobFilter, ICreateCuttingJobInput } from './cutting-job.repository';
import { validate, validateId } from '../../core/validation';
import { createCuttingJobSchema, updateCuttingJobStatusSchema, addJobItemSchema } from '../../core/validation/schemas';

export class CuttingJobController {
    public readonly router: Router;

    constructor(private readonly service: ICuttingJobService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getJobs.bind(this));
        this.router.get('/:id', validateId(), this.getJobById.bind(this));
        this.router.post('/', validate(createCuttingJobSchema), this.createJob.bind(this));
        this.router.post('/auto-generate', this.autoGenerate.bind(this));
        this.router.patch(
            '/:id/status',
            validateId(),
            validate(updateCuttingJobStatusSchema),
            this.updateStatus.bind(this)
        );
        this.router.post('/:id/items', validateId(), validate(addJobItemSchema), this.addItem.bind(this));
        this.router.delete('/:id/items/:orderItemId', validateId(), this.removeItem.bind(this));
        this.router.delete('/:id', validateId(), this.deleteJob.bind(this));
    }

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
    public async getJobs(req: Request, res: Response): Promise<void> {
        const filter: ICuttingJobFilter = {
            status: req.query.status as string | undefined,
            materialTypeId: req.query.materialTypeId as string | undefined,
            thickness: req.query.thickness ? Number.parseFloat(req.query.thickness as string) : undefined
        };

        const result = await this.service.getJobs(filter);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async getJobById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.service.getJobById(id);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 500;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async createJob(req: Request, res: Response): Promise<void> {
        const data = req.body as ICreateCuttingJobInput;
        const result = await this.service.createJob(data);

        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async autoGenerate(req: Request, res: Response): Promise<void> {
        const confirmedOnly = req.body.confirmedOnly !== false;
        const result = await this.service.autoGenerateFromOrders(confirmedOnly);

        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async updateStatus(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { status } = req.body;
        const result = await this.service.updateJobStatus(id, status);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async addItem(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { orderItemId, quantity } = req.body;
        const result = await this.service.addItemToJob(id, orderItemId, quantity);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async removeItem(req: Request, res: Response): Promise<void> {
        const { id, orderItemId } = req.params;
        const result = await this.service.removeItemFromJob(id, orderItemId);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

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
    public async deleteJob(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.service.deleteJob(id);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
}
