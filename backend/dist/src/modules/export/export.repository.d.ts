/**
 * Export Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
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
export interface IExportRepository {
    getStockItemsForExport(): Promise<IExportStockItem[]>;
    getMaterialsForExport(): Promise<IExportMaterial[]>;
    getCustomersForExport(): Promise<IExportCustomer[]>;
    getOrdersForExport(): Promise<IExportOrder[]>;
    getCuttingPlansForExport(): Promise<IExportPlanData[]>;
    findPlanById(planId: string): Promise<IExportPlanData | null>;
    findMaterialTypeById(materialTypeId: string): Promise<IExportMaterialType | null>;
}
export declare class ExportRepository implements IExportRepository {
    private readonly db;
    constructor(db: Database);
    getStockItemsForExport(): Promise<IExportStockItem[]>;
    getMaterialsForExport(): Promise<IExportMaterial[]>;
    getCustomersForExport(): Promise<IExportCustomer[]>;
    getOrdersForExport(): Promise<IExportOrder[]>;
    getCuttingPlansForExport(): Promise<IExportPlanData[]>;
    findPlanById(planId: string): Promise<IExportPlanData | null>;
    findMaterialTypeById(materialTypeId: string): Promise<IExportMaterialType | null>;
}
//# sourceMappingURL=export.repository.d.ts.map