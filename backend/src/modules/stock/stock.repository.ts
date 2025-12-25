/**
 * Stock Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */

import { Database } from '../../db';
import { stockItems, stockMovements } from '../../db/schema';
import { StockType, MovementType } from '../../db/schema/enums';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter } from '../../core/interfaces';
import { createFilter } from '../../core/database';
import { getCurrentTenantIdOptional } from '../../core/tenant';

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

    // ==================== TENANT FILTERING ====================

    private getTenantFilter(): SQL | undefined {
        const tenantId = getCurrentTenantIdOptional();
        if (!tenantId) return undefined;
        return eq(stockItems.tenantId, tenantId);
    }

    private withTenantFilter(conditions: SQL[]): SQL | undefined {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter) conditions.push(tenantFilter);
        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    private getCurrentTenantId(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    // ==================== READ OPERATIONS ====================

    async findById(id: string): Promise<StockItemWithRelations | null> {
        const conditions = [eq(stockItems.id, id)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.stockItems.findFirst({
            where,
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            }
        });
        return result ?? null;
    }

    async findAll(filter?: IStockFilter): Promise<StockItemWithRelations[]> {
        const where = createFilter()
            .eq(stockItems.materialTypeId, filter?.materialTypeId)
            .eq(stockItems.stockType, filter?.stockType as StockType | undefined)
            .eq(stockItems.locationId, filter?.locationId)
            .gte(stockItems.quantity, filter?.minQuantity)
            .eq(stockItems.tenantId, this.getCurrentTenantId())
            .build();

        return this.db.query.stockItems.findMany({
            where,
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            },
            orderBy: [desc(stockItems.createdAt)]
        });
    }

    async findByCode(code: string): Promise<StockItem | null> {
        const conditions = [eq(stockItems.code, code)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.stockItems.findFirst({
            where
        });
        return result ?? null;
    }

    // ==================== WRITE OPERATIONS ====================

    async create(data: ICreateStockInput): Promise<StockItem> {
        const [result] = await this.db.insert(stockItems).values({
            tenantId: this.getCurrentTenantId(),
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
        const conditions = [eq(stockItems.id, id)];
        const where = this.withTenantFilter(conditions);

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
            .where(where ?? eq(stockItems.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        const conditions = [eq(stockItems.id, id)];
        const where = this.withTenantFilter(conditions);

        await this.db.delete(stockItems).where(where ?? eq(stockItems.id, id));
    }

    async updateQuantity(id: string, quantityDelta: number, reservedDelta = 0): Promise<StockItem> {
        const conditions = [eq(stockItems.id, id)];
        const where = this.withTenantFilter(conditions);

        const current = await this.db.query.stockItems.findFirst({
            where
        });

        if (!current) throw new Error('Stock item not found');

        const [result] = await this.db.update(stockItems)
            .set({
                quantity: current.quantity + quantityDelta,
                reservedQty: current.reservedQty + reservedDelta,
                updatedAt: new Date()
            })
            .where(where ?? eq(stockItems.id, id))
            .returning();
        return result;
    }

    // ==================== MOVEMENTS ====================

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
        const where = createFilter()
            .eq(stockMovements.stockItemId, filter?.stockItemId)
            .eq(stockMovements.movementType, filter?.movementType as MovementType | undefined)
            .gte(stockMovements.createdAt, filter?.startDate)
            .lte(stockMovements.createdAt, filter?.endDate)
            .build();

        return this.db.select().from(stockMovements)
            .where(where)
            .orderBy(desc(stockMovements.createdAt))
            .limit(100);
    }
}

