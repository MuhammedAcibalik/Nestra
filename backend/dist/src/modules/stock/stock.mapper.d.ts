/**
 * Stock Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations and validation
 */
import { IStockItemDto, ICreateStockInput } from '../../core/interfaces';
import { StockItemWithRelations } from './stock.repository';
/**
 * Maps StockItem entity to DTO
 */
export declare function toStockItemDto(item: StockItemWithRelations): IStockItemDto;
/**
 * Validates stock creation input
 */
export declare function validateCreateInput(data: ICreateStockInput): {
    code: string;
    message: string;
} | null;
/**
 * Extracts error message from unknown error type
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Generates unique waste code
 */
export declare function generateWasteCode(sourceCode: string): string;
/**
 * Determines stock type based on dimensions
 */
export declare function determineStockType(length?: number, width?: number, height?: number): 'BAR_1D' | 'SHEET_2D';
//# sourceMappingURL=stock.mapper.d.ts.map