/**
 * File Import Service
 * Handles importing order data from Excel (.xlsx) and CSV files
 */
import { PrismaClient } from '@prisma/client';
import { IResult } from '../../core/interfaces';
export interface IColumnMapping {
    itemCode?: string;
    itemName?: string;
    geometryType?: string;
    length?: string;
    width?: string;
    height?: string;
    diameter?: string;
    materialTypeId?: string;
    materialCode?: string;
    thickness?: string;
    quantity?: string;
    canRotate?: string;
}
export interface IImportResult {
    orderId: string;
    orderNumber: string;
    totalRows: number;
    importedItems: number;
    skippedRows: ISkippedRow[];
}
export interface ISkippedRow {
    rowNumber: number;
    reason: string;
    data: Record<string, unknown>;
}
export interface IImportOptions {
    mapping: IColumnMapping;
    skipHeaderRow?: boolean;
    createOrder?: boolean;
    orderId?: string;
    notes?: string;
}
export interface IImportService {
    importFromExcel(buffer: Buffer, options: IImportOptions, userId: string): Promise<IResult<IImportResult>>;
    importFromCSV(buffer: Buffer, options: IImportOptions, userId: string): Promise<IResult<IImportResult>>;
    detectFileType(filename: string): 'excel' | 'csv' | 'unknown';
    suggestMapping(headers: string[]): IColumnMapping;
    getFileHeaders(buffer: Buffer, fileType: 'excel' | 'csv'): Promise<IResult<string[]>>;
}
export declare class ImportService implements IImportService {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    importFromExcel(buffer: Buffer, options: IImportOptions, userId: string): Promise<IResult<IImportResult>>;
    importFromCSV(buffer: Buffer, options: IImportOptions, userId: string): Promise<IResult<IImportResult>>;
    getFileHeaders(buffer: Buffer, fileType: 'excel' | 'csv'): Promise<IResult<string[]>>;
    detectFileType(filename: string): 'excel' | 'csv' | 'unknown';
    suggestMapping(headers: string[]): IColumnMapping;
    private processRows;
    private validateAndMapRow;
    private normalizeGeometryType;
    private parseNumber;
    private parseInt;
    private getErrorMessage;
}
//# sourceMappingURL=import.service.d.ts.map