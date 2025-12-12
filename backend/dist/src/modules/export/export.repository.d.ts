/**
 * Export Repository
 * Handles data access for export operations
 * Following SRP - Only handles export-related data queries
 */
import { PrismaClient } from '@prisma/client';
export interface IExportPlanData {
    id: string;
    planNumber: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    createdAt: Date;
    scenario: {
        name: string;
        cuttingJob: {
            materialTypeId: string;
            thickness: number;
            items: Array<{
                orderItem: {
                    itemCode: string | null;
                    itemName: string | null;
                } | null;
            }>;
        };
    };
    stockItems: Array<{
        sequence: number;
        waste: number;
        wastePercentage: number;
        layoutData: unknown;
        stockItem: {
            code: string;
            stockType: string;
            length: number | null;
            width: number | null;
            height: number | null;
        };
    }>;
}
export interface IMaterialTypeInfo {
    id: string;
    name: string;
}
export interface IExportRepository {
    findPlanById(planId: string): Promise<IExportPlanData | null>;
    findMaterialTypeById(materialTypeId: string): Promise<IMaterialTypeInfo | null>;
    findPlansByIds(planIds: string[]): Promise<IExportPlanData[]>;
}
export declare class ExportRepository implements IExportRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findPlanById(planId: string): Promise<IExportPlanData | null>;
    findMaterialTypeById(materialTypeId: string): Promise<IMaterialTypeInfo | null>;
    findPlansByIds(planIds: string[]): Promise<IExportPlanData[]>;
    private mapPlanToExportData;
}
//# sourceMappingURL=export.repository.d.ts.map