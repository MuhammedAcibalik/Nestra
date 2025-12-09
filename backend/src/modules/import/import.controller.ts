/**
 * Import Controller
 * Handles file upload and import endpoints
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { IImportService, IColumnMapping } from './import.service';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('ImportController');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
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
        } else {
            cb(new Error('Sadece Excel (.xlsx, .xls) ve CSV dosyaları kabul edilir'));
        }
    }
});

export class ImportController {
    public readonly router: Router;

    constructor(private readonly service: IImportService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // POST /api/import/orders - Import orders from file
        this.router.post('/orders', upload.single('file'), this.importOrders.bind(this));

        // POST /api/import/headers - Get file headers for mapping
        this.router.post('/headers', upload.single('file'), this.getHeaders.bind(this));

        // POST /api/import/suggest-mapping - Suggest column mapping
        this.router.post('/suggest-mapping', this.suggestMapping.bind(this));
    }

    private async importOrders(req: Request, res: Response): Promise<void> {
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

            // Get user ID from auth
            const userId = (req as any).user?.id;
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

            // Parse mapping from request body
            let mapping: IColumnMapping;
            try {
                if (req.body.mapping) {
                    mapping = typeof req.body.mapping === 'string'
                        ? JSON.parse(req.body.mapping)
                        : req.body.mapping;
                } else {
                    mapping = {};
                }
            } catch {
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
                result = await this.service.importFromExcel(
                    req.file.buffer,
                    { mapping, notes: req.body.notes },
                    userId
                );
            } else if (fileType === 'csv') {
                result = await this.service.importFromCSV(
                    req.file.buffer,
                    { mapping, notes: req.body.notes },
                    userId
                );
            } else {
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
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
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

    private async getHeaders(req: Request, res: Response): Promise<void> {
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
                // Also suggest mapping
                const suggestedMapping = this.service.suggestMapping(result.data!);

                res.json({
                    success: true,
                    data: {
                        headers: result.data,
                        suggestedMapping
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
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

    private suggestMapping(req: Request, res: Response): void {
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
