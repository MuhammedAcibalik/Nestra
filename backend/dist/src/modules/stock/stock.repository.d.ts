/**
 * Stock Repository
 * Following SRP - Only handles stock data access
 */
import { PrismaClient, StockItem, StockMovement } from '@prisma/client';
import { IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter } from '../../core/interfaces';
export type StockItemWithRelations = StockItem & {
    materialType?: {
        id: string;
        name: string;
    };
    thicknessRange?: {
        id: string;
        name: string;
    } | null;
    location?: {
        id: string;
        name: string;
    } | null;
};
export interface IStockRepository {
    findById(id: string): Promise<StockItemWithRelations | null>;
    findAll(filter?: IStockFilter): Promise<StockItemWithRelations[]>;
    findByCode(code: string): Promise<StockItem | null>;
    create(data: ICreateStockInput): Promise<StockItem>;
    update(id: string, data: IUpdateStockInput): Promise<StockItem>;
    delete(id: string): Promise<void>;
    updateQuantity(id: string, quantityDelta: number, reservedDelta?: number): Promise<StockItem>;
    createMovement(data: ICreateMovementInput): Promise<StockMovement>;
    getMovements(filter?: IMovementFilter): Promise<StockMovement[]>;
}
export declare class StockRepository implements IStockRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<StockItemWithRelations | null>;
    findAll(filter?: IStockFilter): Promise<StockItemWithRelations[]>;
    findByCode(code: string): Promise<StockItem | null>;
    create(data: ICreateStockInput): Promise<StockItem>;
    update(id: string, data: IUpdateStockInput): Promise<StockItem>;
    delete(id: string): Promise<void>;
    updateQuantity(id: string, quantityDelta: number, reservedDelta?: number): Promise<StockItem>;
    createMovement(data: ICreateMovementInput): Promise<StockMovement>;
    getMovements(filter?: IMovementFilter): Promise<StockMovement[]>;
}
//# sourceMappingURL=stock.repository.d.ts.map