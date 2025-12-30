"use strict";
/**
 * File Import Service
 * Handles importing order data from Excel (.xlsx) and CSV files
 * Refactored to use repository injection instead of direct Prisma
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const sync_1 = require("csv-parse/sync");
const interfaces_1 = require("../../core/interfaces");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('ImportService');
// ==================== SERVICE ====================
class ImportService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async importFromExcel(buffer, options, userId) {
        try {
            const workbook = xlsx_1.default.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawData = xlsx_1.default.utils.sheet_to_json(worksheet);
            logger.info('Excel file parsed', {
                sheetName,
                rowCount: rawData.length
            });
            return this.processRows(rawData, options, userId);
        }
        catch (error) {
            logger.error('Excel import failed', error);
            return (0, interfaces_1.failure)({
                code: 'EXCEL_PARSE_ERROR',
                message: 'Excel dosyası işlenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async importFromCSV(buffer, options, userId) {
        try {
            const rawData = (0, sync_1.parse)(buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
            logger.info('CSV file parsed', { rowCount: rawData.length });
            return this.processRows(rawData, options, userId);
        }
        catch (error) {
            logger.error('CSV import failed', error);
            return (0, interfaces_1.failure)({
                code: 'CSV_PARSE_ERROR',
                message: 'CSV dosyası işlenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getFileHeaders(buffer, fileType) {
        try {
            let headers = [];
            if (fileType === 'excel') {
                const workbook = xlsx_1.default.read(buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawData = xlsx_1.default.utils.sheet_to_json(worksheet, { header: 1 });
                if (rawData.length > 0) {
                    headers = Object.values(rawData[0]).map(String);
                }
            }
            else {
                const rawData = (0, sync_1.parse)(buffer, {
                    columns: true,
                    to: 1
                });
                if (rawData.length > 0) {
                    headers = Object.keys(rawData[0]);
                }
            }
            return (0, interfaces_1.success)(headers);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'HEADER_READ_ERROR',
                message: 'Dosya başlıkları okunamadı',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    detectFileType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        if (ext === 'xlsx' || ext === 'xls')
            return 'excel';
        if (ext === 'csv')
            return 'csv';
        return 'unknown';
    }
    suggestMapping(headers) {
        const mapping = {};
        const lowerHeaders = headers.map((h) => h.toLowerCase());
        const patterns = {
            itemCode: ['kod', 'code', 'parça kodu', 'part code', 'item code', 'itemcode'],
            itemName: ['ad', 'name', 'parça adı', 'part name', 'item name', 'itemname', 'açıklama', 'description'],
            geometryType: ['geometri', 'geometry', 'tip', 'type', 'şekil', 'shape'],
            length: ['uzunluk', 'length', 'boy'],
            width: ['genişlik', 'width'],
            height: ['yükseklik', 'height'],
            diameter: ['çap', 'diameter'],
            materialTypeId: ['malzeme id', 'material id', 'materialid'],
            materialCode: ['malzeme', 'material', 'malzeme kodu', 'material code'],
            thickness: ['kalınlık', 'thickness', 'kalınlik'],
            quantity: ['miktar', 'quantity', 'adet', 'qty', 'count'],
            canRotate: ['döndür', 'rotate', 'can rotate', 'döndürülebilir']
        };
        for (const [field, keywords] of Object.entries(patterns)) {
            for (let i = 0; i < lowerHeaders.length; i++) {
                if (keywords.some((k) => lowerHeaders[i].includes(k))) {
                    mapping[field] = headers[i];
                    break;
                }
            }
        }
        return mapping;
    }
    async processRows(rows, options, userId) {
        const { mapping } = options;
        const skippedRows = [];
        const validItems = [];
        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 for 1-indexed and header row
            const validationResult = this.validateAndMapRow(row, mapping);
            if (validationResult.success) {
                validItems.push(validationResult.item);
            }
            else {
                skippedRows.push({
                    rowNumber,
                    reason: validationResult.error,
                    data: row
                });
            }
        }
        if (validItems.length === 0) {
            return (0, interfaces_1.failure)({
                code: 'NO_VALID_ITEMS',
                message: 'İçe aktarılacak geçerli satır bulunamadı',
                details: { skippedRows }
            });
        }
        // Create order with items
        try {
            const orderData = {
                notes: options.notes ?? `İçe aktarım: ${validItems.length} satır`,
                items: validItems
            };
            // Generate order number atomically to avoid race conditions
            const orderNumber = await this.repository.generateOrderNumber();
            const order = await this.repository.createOrderWithItems({
                orderNumber,
                createdById: userId,
                notes: orderData.notes ?? '',
                items: validItems
            });
            logger.info('Import completed', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                importedItems: validItems.length,
                skippedRows: skippedRows.length
            });
            return (0, interfaces_1.success)({
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalRows: rows.length,
                importedItems: validItems.length,
                skippedRows
            });
        }
        catch (error) {
            logger.error('Order creation failed', error);
            return (0, interfaces_1.failure)({
                code: 'ORDER_CREATE_ERROR',
                message: 'Sipariş oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    validateAndMapRow(row, mapping) {
        // Get material type ID
        const materialTypeId = this.extractMaterialTypeId(row, mapping);
        // Get thickness
        const thickness = mapping.thickness ? this.parseNumber(row[mapping.thickness]) : undefined;
        // Get quantity
        const quantity = mapping.quantity ? this.parseInt(row[mapping.quantity]) : 1;
        // Validation
        if (!materialTypeId) {
            return { success: false, error: 'Malzeme türü belirtilmemiş' };
        }
        if (thickness === undefined || thickness <= 0) {
            return { success: false, error: 'Geçersiz kalınlık değeri' };
        }
        if (quantity === undefined || quantity <= 0) {
            return { success: false, error: 'Geçersiz miktar değeri' };
        }
        // Build item
        const item = {
            itemCode: mapping.itemCode ? String(row[mapping.itemCode] ?? '') : undefined,
            itemName: mapping.itemName ? String(row[mapping.itemName] ?? '') : undefined,
            geometryType: mapping.geometryType
                ? this.normalizeGeometryType(String(row[mapping.geometryType] ?? ''))
                : 'RECTANGLE',
            length: mapping.length ? this.parseNumber(row[mapping.length]) : undefined,
            width: mapping.width ? this.parseNumber(row[mapping.width]) : undefined,
            height: mapping.height ? this.parseNumber(row[mapping.height]) : undefined,
            diameter: mapping.diameter ? this.parseNumber(row[mapping.diameter]) : undefined,
            materialTypeId,
            thickness,
            quantity,
            canRotate: mapping.canRotate ? String(row[mapping.canRotate]).toLowerCase() !== 'false' : true
        };
        return { success: true, item };
    }
    normalizeGeometryType(value) {
        const normalized = value.toUpperCase().trim();
        const validTypes = ['BAR_1D', 'RECTANGLE', 'CIRCLE', 'SQUARE', 'POLYGON', 'FREEFORM'];
        // Try to match
        if (validTypes.includes(normalized))
            return normalized;
        // Try common aliases
        if (normalized.includes('BAR') || normalized.includes('1D'))
            return 'BAR_1D';
        if (normalized.includes('RECT') || normalized.includes('DİK'))
            return 'RECTANGLE';
        if (normalized.includes('CIRCLE') || normalized.includes('DAİRE'))
            return 'CIRCLE';
        if (normalized.includes('SQUARE') || normalized.includes('KARE'))
            return 'SQUARE';
        return 'RECTANGLE'; // Default
    }
    parseNumber(value) {
        if (typeof value !== 'string' && typeof value !== 'number')
            return undefined;
        if (value === '')
            return undefined;
        const num = Number.parseFloat(String(value).replace(',', '.'));
        return Number.isNaN(num) ? undefined : num;
    }
    parseInt(value) {
        if (typeof value !== 'string' && typeof value !== 'number')
            return undefined;
        if (value === '')
            return undefined;
        const num = Number.parseInt(String(value), 10);
        return Number.isNaN(num) ? undefined : num;
    }
    extractMaterialTypeId(row, mapping) {
        let materialTypeId = mapping.materialTypeId ? String(row[mapping.materialTypeId] ?? '') : '';
        if (!materialTypeId && mapping.materialCode) {
            // If we have material code, we'd need to look it up
            // For now, just use the code as-is (would need DB lookup in production)
            materialTypeId = String(row[mapping.materialCode] ?? '');
        }
        return materialTypeId;
    }
    getErrorMessage(error) {
        if (error instanceof Error)
            return error.message;
        return String(error);
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=import.service.js.map