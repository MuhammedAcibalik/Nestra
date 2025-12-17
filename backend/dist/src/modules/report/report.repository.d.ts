/**
 * Report Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
export interface IReportFilter {
    startDate?: Date;
    endDate?: Date;
    materialTypeId?: string;
    customerId?: string;
}
export interface WasteReportData {
    date: Date;
    createdAt: Date;
    materialTypeName: string;
    totalWaste: number;
    plannedWaste: number;
    actualWaste: number | null;
    wastePercentage: number;
    planCount: number;
}
export interface EfficiencyData {
    materialTypeId: string;
    materialTypeName: string;
    materialName: string;
    avgEfficiency: number;
    planCount: number;
    totalWaste: number;
    totalStockUsed: number;
}
export interface CustomerReportData {
    customerId: string;
    customerName: string;
    customerCode: string;
    orderCount: number;
    totalItems: number;
    itemCount: number;
    completedPlans: number;
}
export interface MachineReportData {
    machineId: string;
    machineName: string;
    machineCode: string;
    machineType: string;
    planCount: number;
    totalProduction: number;
    totalProductionTime: number;
    avgEfficiency: number;
    avgWastePercentage: number;
}
export interface IProductionStats {
    totalProduction: number;
    completedCount: number;
    averageWaste: number;
}
export interface IReportRepository {
    getProductionStats(filter?: IReportFilter): Promise<IProductionStats>;
    getWasteData(filter?: IReportFilter): Promise<WasteReportData[]>;
    getEfficiencyData(filter?: IReportFilter): Promise<EfficiencyData[]>;
    getTotalPlanCount(filter?: IReportFilter): Promise<number>;
    getCustomerData(filter?: IReportFilter): Promise<CustomerReportData[]>;
    getMachineData(filter?: IReportFilter): Promise<MachineReportData[]>;
}
export declare class ReportRepository implements IReportRepository {
    private readonly db;
    constructor(db: Database);
    getProductionStats(filter?: IReportFilter): Promise<IProductionStats>;
    getWasteData(filter?: IReportFilter): Promise<WasteReportData[]>;
    getEfficiencyData(filter?: IReportFilter): Promise<EfficiencyData[]>;
    getTotalPlanCount(filter?: IReportFilter): Promise<number>;
    getCustomerData(filter?: IReportFilter): Promise<CustomerReportData[]>;
    getMachineData(filter?: IReportFilter): Promise<MachineReportData[]>;
}
//# sourceMappingURL=report.repository.d.ts.map