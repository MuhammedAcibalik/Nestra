/**
 * Report Module Interfaces
 */

import { IResult } from './result.interface';

export interface IReportService {
    getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>>;
    getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>>;
    getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>>;
    getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>>;
    getCostReport(filter: IReportFilter): Promise<IResult<ICostReportDto>>;
    getTrendReport(filter: ITrendFilter): Promise<IResult<ITrendReportDto>>;
    getComparativeReport(filter: IComparativeFilter): Promise<IResult<IComparativeReportDto>>;
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

/** Cost report DTO */
export interface ICostReportDto {
    summary: ICostSummary;
    byMaterial: IMaterialCost[];
}

/** Overall cost summary */
export interface ICostSummary {
    totalMaterialCost: number;
    totalWasteCost: number;
    netCost: number;
    planCount: number;
    avgCostPerPlan: number;
}

/** Material-specific cost breakdown */
export interface IMaterialCost {
    materialTypeId: string;
    materialName: string;
    unitPrice: number;
    totalUsed: number;
    totalWaste: number;
    materialCost: number;
    wasteCost: number;
    stockItemCount: number;
}

// ==================== TREND ANALYSIS INTERFACES ====================

/** Trend report filter */
export interface ITrendFilter {
    startDate: Date;
    endDate: Date;
    metric: TrendMetric;
    groupBy: 'day' | 'week' | 'month';
    materialTypeId?: string;
    machineId?: string;
}

/** Available metrics for trend analysis */
export type TrendMetric =
    | 'WASTE_PERCENTAGE'    // Fire yüzdesi
    | 'EFFICIENCY'          // Verimlilik
    | 'PRODUCTION_TIME'     // Üretim süresi
    | 'PLAN_COUNT'          // Plan sayısı
    | 'COST';               // Maliyet

/** Trend report DTO */
export interface ITrendReportDto {
    metric: TrendMetric;
    period: string;
    dataPoints: ITrendDataPoint[];
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
    changePercentage: number;
    movingAverage: number[];
}

/** Single data point in trend */
export interface ITrendDataPoint {
    period: string;
    value: number;
    count: number;
    previousValue?: number;
    changeFromPrevious?: number;
}

// ==================== COMPARATIVE ANALYSIS INTERFACES ====================

/** Comparative report filter */
export interface IComparativeFilter {
    startDate: Date;
    endDate: Date;
    compareBy: CompareBy;
    metric: TrendMetric;
    ids?: string[]; // Material IDs, Machine IDs, etc.
}

/** Comparison dimensions */
export type CompareBy =
    | 'MATERIAL'    // Malzeme karşılaştırması
    | 'MACHINE'     // Makine karşılaştırması
    | 'OPERATOR'    // Operatör karşılaştırması
    | 'PERIOD';     // Dönem karşılaştırması

/** Comparative report DTO */
export interface IComparativeReportDto {
    metric: TrendMetric;
    compareBy: CompareBy;
    items: IComparisonItem[];
    best: IComparisonSummary;
    worst: IComparisonSummary;
    average: number;
}

/** Single comparison item */
export interface IComparisonItem {
    id: string;
    name: string;
    value: number;
    count: number;
    rank: number;
    deviationFromAvg: number;
}

/** Best/Worst summary */
export interface IComparisonSummary {
    id: string;
    name: string;
    value: number;
}


