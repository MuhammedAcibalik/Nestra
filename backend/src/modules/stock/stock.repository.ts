/**
 * Stock Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { stockItems, stockMovements } from '../../db/schema';
import { StockType, MovementType } from '../../db/schema/enums';
import { eq, desc, gte, and, lte } from 'drizzle-orm';
import { IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter } from '../../core/interfaces';

// Type definitions
export type StockItem = typeof stockItems.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;

export type StockItemWithRelations = StockItem & {
    materialType?: { id: string; name: string };
    thicknessRange?: { id: string; name: string } | null;
    location?: { id: string; name: string } | null;
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

export class StockRepository implements IStockRepository {
    constructor(private readonly db: Database) { }

    async findById(id: string): Promise<StockItemWithRelations | null> {
        const result = await this.db.query.stockItems.findFirst({
            where: eq(stockItems.id, id),
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            }
        });
        return result ?? null;
    }

    async findAll(filter?: IStockFilter): Promise<StockItemWithRelations[]> {
        const conditions = [];

        if (filter?.materialTypeId) conditions.push(eq(stockItems.materialTypeId, filter.materialTypeId));
        if (filter?.stockType) conditions.push(eq(stockItems.stockType, filter.stockType as StockType));
        if (filter?.locationId) conditions.push(eq(stockItems.locationId, filter.locationId));
        if (filter?.minQuantity !== undefined) conditions.push(gte(stockItems.quantity, filter.minQuantity));

        return this.db.query.stockItems.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            },
            orderBy: [desc(stockItems.createdAt)]
        });
    }

    async findByCode(code: string): Promise<StockItem | null> {
        const result = await this.db.query.stockItems.findFirst({
            where: eq(stockItems.code, code)
        });
        return result ?? null;
    }

    async create(data: ICreateStockInput): Promise<StockItem> {
        const [result] = await this.db.insert(stockItems).values({
            code: data.code,
            name: data.name,
            materialTypeId: data.materialTypeId,
            thicknessRangeId: data.thicknessRangeId,
            thickness: data.thickness,
            stockType: data.stockType as StockType,
            length: data.length,
            width: data.width,
            height: data.height,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            locationId: data.locationId
        }).returning();
        return result;
    }

    async update(id: string, data: IUpdateStockInput): Promise<StockItem> {
        const [result] = await this.db.update(stockItems)
            .set({
                code: data.code,
                name: data.name,
                thickness: data.thickness,
                stockType: data.stockType as StockType,
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                unitPrice: data.unitPrice,
                updatedAt: new Date()
            })
            .where(eq(stockItems.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(stockItems).where(eq(stockItems.id, id));
    }

    async updateQuantity(id: string, quantityDelta: number, reservedDelta = 0): Promise<StockItem> {
        // Get current values
        const current = await this.db.query.stockItems.findFirst({
            where: eq(stockItems.id, id)
        });

        if (!current) throw new Error('Stock item not found');

        const [result] = await this.db.update(stockItems)
            .set({
                quantity: current.quantity + quantityDelta,
                reservedQty: current.reservedQty + reservedDelta,
                updatedAt: new Date()
            })
            .where(eq(stockItems.id, id))
            .returning();
        return result;
    }

    async createMovement(data: ICreateMovementInput): Promise<StockMovement> {
        const [result] = await this.db.insert(stockMovements).values({
            stockItemId: data.stockItemId,
            movementType: data.movementType as MovementType,
            quantity: data.quantity,
            notes: data.notes,
            productionLogId: data.productionLogId
        }).returning();
        return result;
    }

    async getMovements(filter?: IMovementFilter): Promise<StockMovement[]> {
        const conditions = [];

        if (filter?.stockItemId) conditions.push(eq(stockMovements.stockItemId, filter.stockItemId));
        if (filter?.movementType) conditions.push(eq(stockMovements.movementType, filter.movementType as MovementType));
        if (filter?.startDate) conditions.push(gte(stockMovements.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(stockMovements.createdAt, filter.endDate));

        return this.db.select().from(stockMovements)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(stockMovements.createdAt))
            .limit(100);
    }
}
