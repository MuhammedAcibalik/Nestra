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
import { Router } from 'express';
import { IMaterialService } from '../../core/interfaces';
export declare class MaterialController {
    private readonly materialService;
    router: Router;
    constructor(materialService: IMaterialService);
    private initializeRoutes;
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
    private getAll;
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
    private getById;
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
    private create;
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
    private update;
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
    private delete;
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
    private addThickness;
}
export declare function createMaterialController(materialService: IMaterialService): MaterialController;
//# sourceMappingURL=material.controller.d.ts.map