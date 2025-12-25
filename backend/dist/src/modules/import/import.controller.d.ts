/**
 * Import Controller
 * Handles file upload and import endpoints
 * @openapi
 * components:
 *   schemas:
 *     ImportResult:
 *       type: object
 *       properties:
 *         importedCount:
 *           type: integer
 *           description: İçe aktarılan kayıt sayısı
 *         skippedCount:
 *           type: integer
 *           description: Atlanan kayıt sayısı
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               row:
 *                 type: integer
 *               message:
 *                 type: string
 *     FileHeaders:
 *       type: object
 *       properties:
 *         headers:
 *           type: array
 *           items:
 *             type: string
 *         suggestedMapping:
 *           type: object
 */
import { Router } from 'express';
import { IImportService } from './import.service';
export declare class ImportController {
    private readonly service;
    readonly router: Router;
    constructor(service: IImportService);
    private initializeRoutes;
    /**
     * @openapi
     * /import/orders:
     *   post:
     *     tags: [Import]
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
     *                 description: Excel (.xlsx, .xls) veya CSV dosyası (max 10MB)
     *               mapping:
     *                 type: string
     *                 description: JSON formatında kolon eşleştirmesi
     *               notes:
     *                 type: string
     *     responses:
     *       201:
     *         description: İçe aktarma başarılı
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/ImportResult'
     *       400:
     *         description: Dosya veya format hatası
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private importOrders;
    /**
     * @openapi
     * /import/headers:
     *   post:
     *     tags: [Import]
     *     summary: Dosya başlıklarını getir
     *     description: Kolon eşleştirme için dosya başlıklarını ve önerilen eşleştirmeyi döner
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
     *     responses:
     *       200:
     *         description: Başlıklar ve önerilen eşleştirme
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/FileHeaders'
     *       400:
     *         description: Dosya hatası
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private getHeaders;
    /**
     * @openapi
     * /import/suggest-mapping:
     *   post:
     *     tags: [Import]
     *     summary: Kolon eşleştirmesi öner
     *     description: Verilen başlıklar için otomatik kolon eşleştirmesi önerir
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - headers
     *             properties:
     *               headers:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Önerilen eşleştirme
     *       400:
     *         description: Geçersiz başlık listesi
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private suggestMapping;
}
//# sourceMappingURL=import.controller.d.ts.map