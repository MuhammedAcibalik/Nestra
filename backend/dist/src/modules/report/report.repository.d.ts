/**
 * Report Repository
 * Following SRP - Only handles report data access
 */
import { PrismaClient } from '@prisma/client';
import { IReportFilter } from '../../core/interfaces';
export interface WasteReportData {
    planId: string;
    planNumber: string;
    plannedWaste: number;
    actualWaste: number | null;
    wastePercentage: number;
    createdAt: Date;
}
export interface EfficiencyData {
    materialTypeId: string;
    materialName: string;
    planCount: number;
    avgEfficiency: number;
    totalStockUsed: number;
}
export interface CustomerReportData {
    customerId: string;
    customerCode: string;
    customerName: string;
    orderCount: number;
    itemCount: number;
}
export interface MachineReportData {
    machineId: string;
    machineCode: string;
    machineName: string;
    machineType: string;
    planCount: number;
    totalProductionTime: number;
    avgWastePercentage: number;
}
export interface IReportRepository {
    getWasteData(filter: IReportFilter): Promise<WasteReportData[]>;
    getEfficiencyData(filter: IReportFilter): Promise<EfficiencyData[]>;
    getCustomerData(filter: IReportFilter): Promise<CustomerReportData[]>;
    getMachineData(filter: IReportFilter): Promise<MachineReportData[]>;
    getTotalPlanCount(filter: IReportFilter): Promise<number>;
}
export declare class ReportRepository implements IReportRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    getWasteData(filter: IReportFilter): Promise<WasteReportData[]>;
    getEfficiencyData(filter: IReportFilter): Promise<EfficiencyData[]>;
    getCustomerData(filter: IReportFilter): Promise<CustomerReportData[]>;
    getMachineData(filter: IReportFilter): Promise<MachineReportData[]>;
    getTotalPlanCount(filter: IReportFilter): Promise<number>;
    private buildPlanWhereClause;
}
//# sourceMappingURL=report.repository.d.ts.map