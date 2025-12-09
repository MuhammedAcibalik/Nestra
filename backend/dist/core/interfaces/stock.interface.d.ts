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
}
export interface IUpdateStockInput extends Partial<ICreateStockInput> {
}
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
//# sourceMappingURL=stock.interface.d.ts.map