/**
 * Order Import Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for Excel/CSV import operations only
 */

import xlsx from 'xlsx';
import {
    IResult,
    success,
    failure,
    IColumnMapping,
    ICreateOrderInput,
    ICreateOrderItemInput
} from '../../core/interfaces';
import { getErrorMessage } from './order.mapper';

/**
 * Excel row data structure
 */
interface ExcelRow {
    [key: string]: string | number | boolean | undefined;
}

/**
 * Order Import Service Interface
 * Following Interface Segregation Principle (ISP)
 */
export interface IOrderImportService {
    /**
     * Import orders from Excel/CSV file
     */
    importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<ICreateOrderInput>>;
}

/**
 * Order Import Service Implementation
 */
export class OrderImportService implements IOrderImportService {
    /**
     * Import orders from Excel/CSV file
     * Parses the file and creates order input data
     */
    async importFromFile(file: Buffer, mapping: IColumnMapping, _userId: string): Promise<IResult<ICreateOrderInput>> {
        try {
            const workbook = xlsx.read(file, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data: ExcelRow[] = xlsx.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return failure({
                    code: 'EMPTY_FILE',
                    message: 'Dosyada veri bulunamadı'
                });
            }

            const items: ICreateOrderItemInput[] = data.map((row) => this.mapRowToOrderItem(row, mapping));

            const orderInput: ICreateOrderInput = {
                notes: `İçe aktarılan dosyadan ${data.length} satır`,
                items
            };

            return success(orderInput);
        } catch (error) {
            return failure({
                code: 'IMPORT_ERROR',
                message: 'Dosya içe aktarılırken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    /**
     * Map Excel row to order item input
     */
    private mapRowToOrderItem(row: ExcelRow, mapping: IColumnMapping): ICreateOrderItemInput {
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
    private parseNumber(value: unknown): number | undefined {
        if (typeof value !== 'string' && typeof value !== 'number') return undefined;
        if (value === '') return undefined;
        const num = Number.parseFloat(String(value));
        return Number.isNaN(num) ? undefined : num;
    }

    /**
     * Parse integer from cell value
     */
    private parseInt(value: unknown): number | undefined {
        if (typeof value !== 'string' && typeof value !== 'number') return undefined;
        if (value === '') return undefined;
        const num = Number.parseInt(String(value), 10);
        return Number.isNaN(num) ? undefined : num;
    }
}
