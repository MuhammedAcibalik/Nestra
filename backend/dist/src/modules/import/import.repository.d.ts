/**
 * Import Repository
 * Handles data access for import operations
 * Following SRP - Only handles import-related data queries
 */
import { PrismaClient } from '@prisma/client';
import { ICreateOrderItemInput } from '../../core/interfaces';
export interface ICreatedOrder {
    id: string;
    orderNumber: string;
}
export interface IImportRepository {
    getOrderCount(): Promise<number>;
    createOrderWithItems(orderNumber: string, userId: string, notes: string, items: ICreateOrderItemInput[]): Promise<ICreatedOrder>;
}
export declare class ImportRepository implements IImportRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    getOrderCount(): Promise<number>;
    createOrderWithItems(orderNumber: string, userId: string, notes: string, items: ICreateOrderItemInput[]): Promise<ICreatedOrder>;
}
//# sourceMappingURL=import.repository.d.ts.map