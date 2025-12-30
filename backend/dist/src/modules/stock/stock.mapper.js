"use strict";
/**
 * Stock Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStockItemDto = toStockItemDto;
exports.validateCreateInput = validateCreateInput;
exports.getErrorMessage = getErrorMessage;
exports.generateWasteCode = generateWasteCode;
exports.determineStockType = determineStockType;
/**
 * Maps StockItem entity to DTO
 */
function toStockItemDto(item) {
    const materialDto = {
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
        stockType: item.stockType,
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
function validateCreateInput(data) {
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
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
/**
 * Generates unique waste code
 */
function generateWasteCode(sourceCode) {
    return `FIRE-${sourceCode}-${Date.now().toString(36).toUpperCase()}`;
}
/**
 * Determines stock type based on dimensions
 */
function determineStockType(length, width, height) {
    return length && !width && !height ? 'BAR_1D' : 'SHEET_2D';
}
//# sourceMappingURL=stock.mapper.js.map