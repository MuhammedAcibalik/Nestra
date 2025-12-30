"use strict";
/**
 * Order Import Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for Excel/CSV import operations only
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderImportService = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const interfaces_1 = require("../../core/interfaces");
const order_mapper_1 = require("./order.mapper");
/**
 * Order Import Service Implementation
 */
class OrderImportService {
    /**
     * Import orders from Excel/CSV file
     * Parses the file and creates order input data
     */
    async importFromFile(file, mapping, _userId) {
        try {
            const workbook = xlsx_1.default.read(file, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx_1.default.utils.sheet_to_json(worksheet);
            if (data.length === 0) {
                return (0, interfaces_1.failure)({
                    code: 'EMPTY_FILE',
                    message: 'Dosyada veri bulunamadı'
                });
            }
            const items = data.map((row) => this.mapRowToOrderItem(row, mapping));
            const orderInput = {
                notes: `İçe aktarılan dosyadan ${data.length} satır`,
                items
            };
            return (0, interfaces_1.success)(orderInput);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'IMPORT_ERROR',
                message: 'Dosya içe aktarılırken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    /**
     * Map Excel row to order item input
     */
    mapRowToOrderItem(row, mapping) {
        return {
            itemCode: mapping.itemCode ? String(row[mapping.itemCode] ?? '') : undefined,
            itemName: mapping.itemName ? String(row[mapping.itemName] ?? '') : undefined,
            geometryType: mapping.geometryType ? String(row[mapping.geometryType] ?? 'RECTANGLE') : 'RECTANGLE',
            length: mapping.length ? this.parseNumber(row[mapping.length]) : undefined,
            width: mapping.width ? this.parseNumber(row[mapping.width]) : undefined,
            height: mapping.height ? this.parseNumber(row[mapping.height]) : undefined,
            materialTypeId: mapping.materialTypeId ? String(row[mapping.materialTypeId] ?? '') : '',
            thickness: mapping.thickness ? (this.parseNumber(row[mapping.thickness]) ?? 0) : 0,
            quantity: mapping.quantity ? (this.parseInt(row[mapping.quantity]) ?? 1) : 1,
            canRotate: mapping.canRotate ? row[mapping.canRotate] !== 'false' : true
        };
    }
    /**
     * Parse float number from cell value
     */
    parseNumber(value) {
        if (typeof value !== 'string' && typeof value !== 'number')
            return undefined;
        if (value === '')
            return undefined;
        const num = Number.parseFloat(String(value));
        return Number.isNaN(num) ? undefined : num;
    }
    /**
     * Parse integer from cell value
     */
    parseInt(value) {
        if (typeof value !== 'string' && typeof value !== 'number')
            return undefined;
        if (value === '')
            return undefined;
        const num = Number.parseInt(String(value), 10);
        return Number.isNaN(num) ? undefined : num;
    }
}
exports.OrderImportService = OrderImportService;
//# sourceMappingURL=order-import.service.js.map