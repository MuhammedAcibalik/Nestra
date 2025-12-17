/**
 * Stock Module Interfaces
 */

import { IResult } from './result.interface';
import { IMaterialDto } from './material.interface';

export type StockType = 'BAR_1D' | 'SHEET_2D';
export type MovementType = 'PURCHASE' | 'CONSUMPTION' | 'WASTE_REUSE' | 'SCRAP' | 'ADJUSTMENT' | 'TRANSFER';

export interface IStockService {
    getStockItems(filter?: IStockFilter): Promise<IResult<IStockItemDto[]>>;
    getStockItemById(id: string): Promise<IResult<IStockItemDto>>;
    createStockItem(data: ICreateStockInput): Promise<IResult<IStockItemDto>>;
    updateStockItem(id: string, data: IUpdateStockInput): Promise<IResult<IStockItemDto>>;
    deleteStockItem(id: string): Promise<IResult<void>>;
    createMovement(data: ICreateMovementInput): Promise<IResult<IStockMovementDto>>;
    getMovements(filter?: IMovementFilter): Promise<IResult<IStockMovementDto[]>>;

    // Stock alert methods
    checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>>;
    getLowStockItems(threshold?: number): Promise<IResult<IStockItemDto[]>>;

    // Waste piece registration
    registerWastePiece(data: IRegisterWasteInput): Promise<IResult<IStockItemDto>>;
}

export interface IStockFilter {
    materialTypeId?: string;
    stockType?: StockType;
    locationId?: string;
    minQuantity?: number;
}

export interface IStockItemDto {
    id: string;
    code: string;
    name: string;
    materialType: IMaterialDto;
    thickness: number;
    stockType: StockType;
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
    reservedQty: number;
    availableQty: number;
    unitPrice?: number;
    isFromWaste: boolean;
}

export interface ICreateStockInput {
    code: string;
    name: string;
    materialTypeId: string;
    thicknessRangeId?: string;
    thickness: number;
    stockType: StockType;
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
    unitPrice?: number;
    locationId?: string;
    isFromWaste?: boolean;
}

export interface IUpdateStockInput extends Partial<ICreateStockInput> { }

export interface IStockMovementDto {
    id: string;
    stockItemId: string;
    movementType: string;
    quantity: number;
    notes?: string;
    createdAt: Date;
}

export interface ICreateMovementInput {
    stockItemId: string;
    movementType: MovementType;
    quantity: number;
    notes?: string;
    productionLogId?: string;
}

export interface IMovementFilter {
    stockItemId?: string;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
}

// ==================== STOCK ALERT TYPES ====================

export interface ILowStockAlert {
    stockItemId: string;
    stockCode: string;
    stockName: string;
    materialTypeName: string;
    currentQuantity: number;
    minQuantity: number;
    alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
    notifiedAt: Date;
}

// ==================== WASTE PIECE TYPES ====================

export interface IRegisterWasteInput {
    /** Original stock item that was cut */
    sourceStockItemId: string;
    /** Dimensions of waste piece */
    length?: number;
    width?: number;
    height?: number;
    /** Quantity of waste pieces */
    quantity: number;
    /** Production log that generated this waste */
    productionLogId?: string;
    /** Notes about the waste */
    notes?: string;
}
