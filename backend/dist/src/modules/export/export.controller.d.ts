/**
 * Export Controller
 * Handles HTTP requests for PDF and Excel export
 * Refactored to follow microservice architecture - uses repository injection
 * @openapi
 * tags:
 *   - name: Export
 *     description: PDF ve Excel dışa aktarma işlemleri
 */
import { Router } from 'express';
import { IExportRepository } from './export.repository';
export interface IExportController {
    readonly router: Router;
}
export declare class ExportController implements IExportController {
    private readonly repository;
    readonly router: Router;
    constructor(repository: IExportRepository);
    private initializeRoutes;
    /**
     * @openapi
     * /export/plan/{planId}/pdf:
     *   get:
     *     tags: [Export]
     *     summary: Planı PDF olarak dışa aktar
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: planId
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: layouts
     *         in: query
     *         schema:
     *           type: boolean
     *       - name: pieces
     *         in: query
     *         schema:
     *           type: boolean
     *       - name: lang
     *         in: query
     *         schema:
     *           type: string
     *           enum: [tr, en]
     *     responses:
     *       200:
     *         description: PDF dosyası
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    private exportPlanToPdf;
    /**
     * @openapi
     * /export/plan/{planId}/excel:
     *   get:
     *     tags: [Export]
     *     summary: Planı Excel olarak dışa aktar
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: planId
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: layouts
     *         in: query
     *         schema:
     *           type: boolean
     *       - name: pieces
     *         in: query
     *         schema:
     *           type: boolean
     *       - name: lang
     *         in: query
     *         schema:
     *           type: string
     *           enum: [tr, en]
     *     responses:
     *       200:
     *         description: Excel dosyası
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    private exportPlanToExcel;
    /**
     * @openapi
     * /export/plans/excel:
     *   post:
     *     tags: [Export]
     *     summary: Birden fazla planı Excel olarak dışa aktar
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - planIds
     *             properties:
     *               planIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: uuid
     *     responses:
     *       200:
     *         description: Excel dosyası
     *       400:
     *         description: Plan ID listesi gerekli
     */
    private exportMultiplePlansToExcel;
    /**
     * Transform repository data to export format
     */
    private getPlanExportData;
    /**
     * Transform stock items to layout export format
     */
    private transformLayouts;
}
//# sourceMappingURL=export.controller.d.ts.map