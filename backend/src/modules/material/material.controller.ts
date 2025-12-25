/**
 * Material Controller
 * Following Single Responsibility Principle (SRP): Only handles HTTP concerns
 * @openapi
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: ALM-6061
 *         name:
 *           type: string
 *           example: Alüminyum 6061
 *         description:
 *           type: string
 *         density:
 *           type: number
 *           description: Yoğunluk (g/cm³)
 *         thicknessRanges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ThicknessRange'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ThicknessRange:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         minThickness:
 *           type: number
 *         maxThickness:
 *           type: number
 *     CreateMaterialRequest:
 *       type: object
 *       required:
 *         - code
 *         - name
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         density:
 *           type: number
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IMaterialService } from '../../core/interfaces';

export class MaterialController {
    public router: Router;

    constructor(private readonly materialService: IMaterialService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/:id/thicknesses', this.addThickness.bind(this));
    }

    /**
     * @openapi
     * /materials:
     *   get:
     *     tags: [Materials]
     *     summary: Malzemeleri listele
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Malzeme listesi
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
     *                     $ref: '#/components/schemas/Material'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.getMaterials();

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
     * /materials/{id}:
     *   get:
     *     tags: [Materials]
     *     summary: Malzeme detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Malzeme detayı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.getMaterialById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * @openapi
     * /materials:
     *   post:
     *     tags: [Materials]
     *     summary: Yeni malzeme oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateMaterialRequest'
     *     responses:
     *       201:
     *         description: Malzeme oluşturuldu
     *       400:
     *         description: Geçersiz istek
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.createMaterial(req.body);

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
     * /materials/{id}:
     *   put:
     *     tags: [Materials]
     *     summary: Malzeme güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateMaterialRequest'
     *     responses:
     *       200:
     *         description: Malzeme güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.updateMaterial(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * @openapi
     * /materials/{id}:
     *   delete:
     *     tags: [Materials]
     *     summary: Malzeme sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Malzeme silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.deleteMaterial(req.params.id);

            if (result.success) {
                res.json({ success: true, message: 'Malzeme silindi' });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * @openapi
     * /materials/{id}/thicknesses:
     *   post:
     *     tags: [Materials]
     *     summary: Kalınlık aralığı ekle
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
     *               - minThickness
     *               - maxThickness
     *             properties:
     *               minThickness:
     *                 type: number
     *               maxThickness:
     *                 type: number
     *     responses:
     *       201:
     *         description: Kalınlık aralığı eklendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private async addThickness(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.addThicknessRange(req.params.id, req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createMaterialController(materialService: IMaterialService): MaterialController {
    return new MaterialController(materialService);
}
