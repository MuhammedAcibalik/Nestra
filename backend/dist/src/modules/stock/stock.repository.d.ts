/**
 * Stock Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { stockItems, stockMovements } from '../../db/schema';
import { IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter } from '../../core/interfaces';
export type StockItem = typeof stockItems.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
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
    private readonly db;
    constructor(db: Database);
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