/**
 * Report Module Interfaces
 */
import { IResult } from './result.interface';
export interface IReportService {
    getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>>;
    getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>>;
    getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>>;
    getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>>;
}
export interface IReportFilter {
    startDate?: Date;
    endDate?: Date;
    materialTypeId?: string;
    customerId?: string;
    machineId?: string;
    groupBy?: 'day' | 'week' | 'month';
}
export interface IWasteReportDto {
    summary: IWasteSummary;
    byPeriod: IWastePeriod[];
}
export interface IWasteSummary {
    totalPlans: number;
    totalPlannedWaste: number;
    totalActualWaste: number;
    avgWastePercentage: number;
    wasteVariance: number;
}
export interface IWastePeriod {
    period: string;
    count: number;
    totalWaste: number;
    avgWastePercentage: number;
}
export interface IEfficiencyReportDto {
    overall: IOverallEfficiency;
    byMaterial: IMaterialEfficiency[];
}
export interface IOverallEfficiency {
    totalPlans: number;
    avgEfficiency: number;
}
export interface IMaterialEfficiency {
    materialTypeId: string;
    materialName: string;
    planCount: number;
    avgEfficiency: number;
    totalStockUsed: number;
}
export interface ICustomerReportDto {
    customerId: string;
    customerName: string;
    customerCode: string;
    orderCount: number;
    itemCount: number;
    planCount: number;
    totalWaste: number;
    avgWaste: number;
}
export interface IMachineReportDto {
    machineId: string;
    machineName: string;
    machineCode: string;
    machineType: string;
    planCount: number;
    totalProductionTime: number;
    avgWastePercentage: number;
}
//# sourceMappingURL=report.interface.d.ts.map