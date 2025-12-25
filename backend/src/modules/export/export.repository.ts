/**
 * Export Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { stockItems, materialTypes, customers, orders, cuttingPlans } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

// ==================== TYPE DEFINITIONS ====================

export interface IExportStockItem {
    id: string;
    code: string;
    materialTypeName: string;
    stockType: string;
    length: number | null;
    width: number | null;
    quantity: number;
    locationName: string | null;
}

export interface IExportMaterial {
    id: string;
    name: string;
    description: string | null;
    defaultDensity: number | null;
}

export interface IExportCustomer {
    id: string;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

export interface IExportOrder {
    id: string;
    orderNumber: string;
    customerName: string | null;
    status: string;
    itemCount: number;
    createdAt: Date;
}

export interface IExportPlanStockItem {
    stockItemId: string;
    sequence: number;
    waste: number;
    wastePercentage: number;
    layoutData: unknown;
}

export interface IExportPlanData {
    id: string;
    planNumber: string;
    scenarioId: string | null;
    scenarioName: string | null;
    materialTypeId: string | null;
    thickness: number | null;
    status: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    stockItems: IExportPlanStockItem[];
    createdAt: Date;
}

export interface IExportMaterialType {
    id: string;
    name: string;
    description: string | null;
}

// ==================== INTERFACE ====================

export interface IExportRepository {
    getStockItemsForExport(): Promise<IExportStockItem[]>;
    getMaterialsForExport(): Promise<IExportMaterial[]>;
    getCustomersForExport(): Promise<IExportCustomer[]>;
    getOrdersForExport(): Promise<IExportOrder[]>;
    getCuttingPlansForExport(): Promise<IExportPlanData[]>;
    findPlanById(planId: string): Promise<IExportPlanData | null>;
    findMaterialTypeById(materialTypeId: string): Promise<IExportMaterialType | null>;
}

// ==================== REPOSITORY ====================

export class ExportRepository implements IExportRepository {
    constructor(private readonly db: Database) {}

    async getStockItemsForExport(): Promise<IExportStockItem[]> {
        const results = await this.db.query.stockItems.findMany({
            with: {
                materialType: true,
                location: true
            },
            orderBy: [desc(stockItems.createdAt)]
        });

        return results.map((item) => ({
            id: item.id,
            code: item.code,
            materialTypeName: (item as { materialType?: { name: string } }).materialType?.name ?? '',
            stockType: item.stockType,
            length: item.length,
            width: item.width,
            quantity: item.quantity,
            locationName: (item as { location?: { name: string } }).location?.name ?? null
        }));
    }

    async getMaterialsForExport(): Promise<IExportMaterial[]> {
        const results = await this.db
            .select({
                id: materialTypes.id,
                name: materialTypes.name,
                description: materialTypes.description,
                defaultDensity: materialTypes.defaultDensity
            })
            .from(materialTypes);

        return results;
    }

    async getCustomersForExport(): Promise<IExportCustomer[]> {
        const results = await this.db
            .select({
                id: customers.id,
                code: customers.code,
                name: customers.name,
                email: customers.email,
                phone: customers.phone,
                address: customers.address
            })
            .from(customers);

        return results;
    }

    async getOrdersForExport(): Promise<IExportOrder[]> {
        const results = await this.db.query.orders.findMany({
            with: {
                items: true,
                customer: true
            },
            orderBy: [desc(orders.createdAt)]
        });

        return results.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: (order as { customer?: { name: string } }).customer?.name ?? null,
            status: order.status,
            itemCount: (order as { items?: unknown[] }).items?.length ?? 0,
            createdAt: order.createdAt
        }));
    }

    async getCuttingPlansForExport(): Promise<IExportPlanData[]> {
        const results = await this.db.query.cuttingPlans.findMany({
            with: {
                stockItems: true,
                scenario: true
            },
            orderBy: [desc(cuttingPlans.createdAt)]
        });

        return results.map((plan) => ({
            id: plan.id,
            planNumber: plan.planNumber,
            scenarioId: plan.scenarioId,
            scenarioName: (plan as { scenario?: { name: string } }).scenario?.name ?? null,
            materialTypeId: null,
            thickness: null,
            status: plan.status,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            stockItems: (
                (
                    plan as {
                        stockItems?: Array<{
                            stockItemId: string;
                            sequence: number;
                            waste: number;
                            wastePercentage: number;
                            layoutData: unknown;
                        }>;
                    }
                ).stockItems ?? []
            ).map((si) => ({
                stockItemId: si.stockItemId,
                sequence: si.sequence,
                waste: si.waste,
                wastePercentage: si.wastePercentage,
                layoutData: si.layoutData
            })),
            createdAt: plan.createdAt
        }));
    }

    async findPlanById(planId: string): Promise<IExportPlanData | null> {
        const result = await this.db.query.cuttingPlans.findFirst({
            where: eq(cuttingPlans.id, planId),
            with: {
                stockItems: true,
                scenario: true
            }
        });

        if (!result) return null;

        return {
            id: result.id,
            planNumber: result.planNumber,
            scenarioId: result.scenarioId,
            scenarioName: (result as { scenario?: { name: string } }).scenario?.name ?? null,
            materialTypeId: null,
            thickness: null,
            status: result.status,
            totalWaste: result.totalWaste,
            wastePercentage: result.wastePercentage,
            stockUsedCount: result.stockUsedCount,
            stockItems: (
                (
                    result as {
                        stockItems?: Array<{
                            stockItemId: string;
                            sequence: number;
                            waste: number;
                            wastePercentage: number;
                            layoutData: unknown;
                        }>;
                    }
                ).stockItems ?? []
            ).map((si) => ({
                stockItemId: si.stockItemId,
                sequence: si.sequence,
                waste: si.waste,
                wastePercentage: si.wastePercentage,
                layoutData: si.layoutData
            })),
            createdAt: result.createdAt
        };
    }

    async findMaterialTypeById(materialTypeId: string): Promise<IExportMaterialType | null> {
        const result = await this.db
            .select({
                id: materialTypes.id,
                name: materialTypes.name,
                description: materialTypes.description
            })
            .from(materialTypes)
            .where(eq(materialTypes.id, materialTypeId))
            .limit(1);

        return result[0] ?? null;
    }
}
