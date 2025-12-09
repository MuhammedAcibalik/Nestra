/**
 * Stock Repository
 * Following SRP - Only handles stock data access
 */

import { PrismaClient, StockItem, StockMovement, StockType } from '@prisma/client';
import { IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter, MovementType } from '../../core/interfaces';

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

interface StockWhereInput {
    materialTypeId?: string;
    stockType?: StockType;
    locationId?: string;
    quantity?: { gte: number };
}

interface MovementWhereInput {
    stockItemId?: string;
    movementType?: MovementType;
    createdAt?: { gte?: Date; lte?: Date };
}

export class StockRepository implements IStockRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<StockItemWithRelations | null> {
        return this.prisma.stockItem.findUnique({
            where: { id },
            include: {
                materialType: { select: { id: true, name: true } },
                thicknessRange: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } }
            }
        });
    }

    async findAll(filter?: IStockFilter): Promise<StockItemWithRelations[]> {
        const where: StockWhereInput = {};

        if (filter?.materialTypeId) where.materialTypeId = filter.materialTypeId;
        if (filter?.stockType) where.stockType = filter.stockType as StockType;
        if (filter?.locationId) where.locationId = filter.locationId;
        if (filter?.minQuantity !== undefined) where.quantity = { gte: filter.minQuantity };

        return this.prisma.stockItem.findMany({
            where,
            include: {
                materialType: { select: { id: true, name: true } },
                thicknessRange: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByCode(code: string): Promise<StockItem | null> {
        return this.prisma.stockItem.findUnique({ where: { code } });
    }

    async create(data: ICreateStockInput): Promise<StockItem> {
        return this.prisma.stockItem.create({
            data: {
                code: data.code,
                name: data.name,
                materialTypeId: data.materialTypeId,
                thicknessRangeId: data.thicknessRangeId,
                thickness: data.thickness,
                stockType: data.stockType as 'BAR_1D' | 'SHEET_2D',
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                unitPrice: data.unitPrice,
                locationId: data.locationId
            }
        });
    }

    async update(id: string, data: IUpdateStockInput): Promise<StockItem> {
        return this.prisma.stockItem.update({
            where: { id },
            data: {
                code: data.code,
                name: data.name,
                thickness: data.thickness,
                stockType: data.stockType,
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                unitPrice: data.unitPrice
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.stockItem.delete({ where: { id } });
    }

    async updateQuantity(id: string, quantityDelta: number, reservedDelta = 0): Promise<StockItem> {
        return this.prisma.stockItem.update({
            where: { id },
            data: {
                quantity: { increment: quantityDelta },
                reservedQty: { increment: reservedDelta }
            }
        });
    }

    async createMovement(data: ICreateMovementInput): Promise<StockMovement> {
        return this.prisma.stockMovement.create({
            data: {
                stockItemId: data.stockItemId,
                movementType: data.movementType,
                quantity: data.quantity,
                notes: data.notes,
                productionLogId: data.productionLogId
            }
        });
    }

    async getMovements(filter?: IMovementFilter): Promise<StockMovement[]> {
        const where: MovementWhereInput = {};

        if (filter?.stockItemId) where.stockItemId = filter.stockItemId;
        if (filter?.movementType) where.movementType = filter.movementType as MovementType;
        if (filter?.startDate || filter?.endDate) {
            where.createdAt = {};
            if (filter.startDate) where.createdAt.gte = filter.startDate;
            if (filter.endDate) where.createdAt.lte = filter.endDate;
        }

        return this.prisma.stockMovement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
}
