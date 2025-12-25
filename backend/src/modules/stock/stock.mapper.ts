/**
 * Stock Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations and validation
 */

import { IStockItemDto, IMaterialDto, ICreateStockInput } from '../../core/interfaces';
import { StockItemWithRelations } from './stock.repository';

/**
 * Maps StockItem entity to DTO
 */
export function toStockItemDto(item: StockItemWithRelations): IStockItemDto {
    const materialDto: IMaterialDto = {
        id: item.materialType?.id ?? '',
        name: item.materialType?.name ?? '',
        isRotatable: true,
        thicknessRanges: []
    };

    return {
        id: item.id,
        code: item.code,
        name: item.name,
        materialType: materialDto,
        thickness: item.thickness,
        stockType: item.stockType as 'BAR_1D' | 'SHEET_2D',
        length: item.length ?? undefined,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
        quantity: item.quantity,
        reservedQty: item.reservedQty,
        availableQty: item.quantity - item.reservedQty,
        unitPrice: item.unitPrice ?? undefined,
        isFromWaste: item.isFromWaste
    };
}

/**
 * Validates stock creation input
 */
export function validateCreateInput(data: ICreateStockInput): { code: string; message: string } | null {
    if (!data.code || !data.name || !data.materialTypeId) {
        return {
            code: 'VALIDATION_ERROR',
            message: 'Kod, isim ve malzeme türü zorunludur'
        };
    }

    if (data.stockType === 'BAR_1D' && !data.length) {
        return {
            code: 'VALIDATION_ERROR',
            message: '1D stok için uzunluk zorunludur'
        };
    }

    if (data.stockType === 'SHEET_2D' && (!data.width || !data.height)) {
        return {
            code: 'VALIDATION_ERROR',
            message: '2D stok için genişlik ve yükseklik zorunludur'
        };
    }

    return null;
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Generates unique waste code
 */
export function generateWasteCode(sourceCode: string): string {
    return `FIRE-${sourceCode}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Determines stock type based on dimensions
 */
export function determineStockType(length?: number, width?: number, height?: number): 'BAR_1D' | 'SHEET_2D' {
    return (length && !width && !height) ? 'BAR_1D' : 'SHEET_2D';
}
