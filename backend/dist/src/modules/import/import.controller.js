"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('ImportController');
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel', // xls
            'text/csv',
            'application/csv'
        ];
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (allowedTypes.includes(file.mimetype) || ['xlsx', 'xls', 'csv'].includes(ext || '')) {
            cb(null, true);
        }
        else {
            cb(new Error('Sadece Excel (.xlsx, .xls) ve CSV dosyaları kabul edilir'));
        }
    }
});
class ImportController {
    service;
    router;
    constructor(service) {
        this.service = service;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/orders', upload.single('file'), this.importOrders.bind(this));
        this.router.post('/headers', upload.single('file'), this.getHeaders.bind(this));
        this.router.post('/suggest-mapping', this.suggestMapping.bind(this));
    }
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
    async importOrders(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'NO_FILE',
                        message: 'Dosya yüklenmedi'
                    }
                });
                return;
            }
            const userId = req.user?.id ?? req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Kullanıcı kimliği bulunamadı'
                    }
                });
                return;
            }
            let mapping;
            try {
                if (req.body.mapping) {
                    mapping = typeof req.body.mapping === 'string' ? JSON.parse(req.body.mapping) : req.body.mapping;
                }
                else {
                    mapping = {};
                }
            }
            catch (parseError) {
                logger.debug('Mapping parse failed:', parseError instanceof Error ? { message: parseError.message } : {});
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_MAPPING',
                        message: 'Geçersiz kolon eşleştirmesi'
                    }
                });
                return;
            }
            const fileType = this.service.detectFileType(req.file.originalname);
            logger.info('Processing import', {
                filename: req.file.originalname,
                fileType,
                size: req.file.size
            });
            let result;
            if (fileType === 'excel') {
                result = await this.service.importFromExcel(req.file.buffer, { mapping, notes: req.body.notes }, userId);
            }
            else if (fileType === 'csv') {
                result = await this.service.importFromCSV(req.file.buffer, { mapping, notes: req.body.notes }, userId);
            }
            else {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_FILE',
                        message: 'Desteklenmeyen dosya türü'
                    }
                });
                return;
            }
            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: result.data
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            logger.error('Import failed', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'IMPORT_ERROR',
                    message: 'Dosya içe aktarılırken hata oluştu'
                }
            });
        }
    }
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
    async getHeaders(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'NO_FILE',
                        message: 'Dosya yüklenmedi'
                    }
                });
                return;
            }
            const fileType = this.service.detectFileType(req.file.originalname);
            if (fileType === 'unknown') {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_FILE',
                        message: 'Desteklenmeyen dosya türü'
                    }
                });
                return;
            }
            const result = await this.service.getFileHeaders(req.file.buffer, fileType);
            if (result.success) {
                const suggestedMapping = this.service.suggestMapping(result.data);
                res.json({
                    success: true,
                    data: {
                        headers: result.data,
                        suggestedMapping
                    }
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            logger.error('Get headers failed', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'HEADER_READ_ERROR',
                    message: 'Dosya başlıkları okunamadı'
                }
            });
        }
    }
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
    suggestMapping(req, res) {
        const { headers } = req.body;
        if (!headers || !Array.isArray(headers)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_HEADERS',
                    message: 'Geçerli başlık listesi gerekli'
                }
            });
            return;
        }
        const mapping = this.service.suggestMapping(headers);
        res.json({
            success: true,
            data: mapping
        });
    }
}
exports.ImportController = ImportController;
//# sourceMappingURL=import.controller.js.map