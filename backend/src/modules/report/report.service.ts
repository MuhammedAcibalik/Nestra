/**
 * Report Service
 * Following SOLID principles with proper types
 */

import {
    IReportService,
    IReportFilter,
    IWasteReportDto,
    IEfficiencyReportDto,
    ICustomerReportDto,
    IMachineReportDto,
    IWasteSummary,
    IWastePeriod,
    IOverallEfficiency,
    IMaterialEfficiency,
    IResult,
    success,
    failure
} from '../../core/interfaces';
import { IReportRepository, WasteReportData } from './report.repository';

export class ReportService implements IReportService {
    constructor(private readonly repository: IReportRepository) { }

    async getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>> {
        try {
            const wasteData = await this.repository.getWasteData(filter);

            const summary = this.calculateWasteSummary(wasteData);
            const byPeriod = this.groupWasteByPeriod(wasteData, filter.groupBy ?? 'month');

            return success({
                summary,
                byPeriod
            });
        } catch (error) {
            return failure({
                code: 'WASTE_REPORT_ERROR',
                message: 'Fire raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>> {
        try {
            const efficiencyData = await this.repository.getEfficiencyData(filter);
            const totalPlanCount = await this.repository.getTotalPlanCount(filter);

            const totalEfficiency = efficiencyData.reduce((sum, d) => sum + d.avgEfficiency * d.planCount, 0);
            const weightedAvgEfficiency = totalPlanCount > 0 ? totalEfficiency / totalPlanCount : 0;

            const overall: IOverallEfficiency = {
                totalPlans: totalPlanCount,
                avgEfficiency: weightedAvgEfficiency
            };

            const byMaterial: IMaterialEfficiency[] = efficiencyData.map((d) => ({
                materialTypeId: d.materialTypeId,
                materialName: d.materialName,
                planCount: d.planCount,
                avgEfficiency: d.avgEfficiency,
                totalStockUsed: d.totalStockUsed
            }));

            return success({
                overall,
                byMaterial
            });
        } catch (error) {
            return failure({
                code: 'EFFICIENCY_REPORT_ERROR',
                message: 'Verimlilik raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>> {
        try {
            const customerData = await this.repository.getCustomerData(filter);

            const dtos: ICustomerReportDto[] = customerData.map((c) => ({
                customerId: c.customerId,
                customerName: c.customerName,
                customerCode: c.customerCode,
                orderCount: c.orderCount,
                itemCount: c.itemCount,
                planCount: 0, // Simplified - would require complex nested queries
                totalWaste: 0,
                avgWaste: 0
            }));

            return success(dtos);
        } catch (error) {
            return failure({
                code: 'CUSTOMER_REPORT_ERROR',
                message: 'Müşteri raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>> {
        try {
            const machineData = await this.repository.getMachineData(filter);

            const dtos: IMachineReportDto[] = machineData.map((m) => ({
                machineId: m.machineId,
                machineName: m.machineName,
                machineCode: m.machineCode,
                machineType: m.machineType,
                planCount: m.planCount,
                totalProductionTime: m.totalProductionTime,
                avgWastePercentage: m.avgWastePercentage
            }));

            return success(dtos);
        } catch (error) {
            return failure({
                code: 'MACHINE_REPORT_ERROR',
                message: 'Makine raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private calculateWasteSummary(data: WasteReportData[]): IWasteSummary {
        if (data.length === 0) {
            return {
                totalPlans: 0,
                totalPlannedWaste: 0,
                totalActualWaste: 0,
                avgWastePercentage: 0,
                wasteVariance: 0
            };
        }

        const totalPlannedWaste = data.reduce((sum, d) => sum + d.plannedWaste, 0);
        const actualWasteData = data.filter((d) => d.actualWaste !== null);
        const totalActualWaste = actualWasteData.reduce((sum, d) => sum + (d.actualWaste ?? 0), 0);
        const avgWastePercentage = data.reduce((sum, d) => sum + d.wastePercentage, 0) / data.length;

        const wasteVariance = actualWasteData.length > 0
            ? ((totalActualWaste - totalPlannedWaste) / totalPlannedWaste) * 100
            : 0;

        return {
            totalPlans: data.length,
            totalPlannedWaste,
            totalActualWaste,
            avgWastePercentage,
            wasteVariance
        };
    }

    private groupWasteByPeriod(
        data: WasteReportData[],
        groupBy: 'day' | 'week' | 'month'
    ): IWastePeriod[] {
        const groups = new Map<string, WasteReportData[]>();

        for (const item of data) {
            const period = this.getPeriodKey(item.createdAt, groupBy);
            const existing = groups.get(period) ?? [];
            existing.push(item);
            groups.set(period, existing);
        }

        const periods: IWastePeriod[] = [];

        for (const [period, items] of groups) {
            const totalWaste = items.reduce((sum, d) => sum + d.plannedWaste, 0);
            const avgWastePercentage = items.reduce((sum, d) => sum + d.wastePercentage, 0) / items.length;

            periods.push({
                period,
                count: items.length,
                totalWaste,
                avgWastePercentage
            });
        }

        return periods.sort((a, b) => a.period.localeCompare(b.period));
    }

    private getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        switch (groupBy) {
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week': {
                const weekNumber = this.getWeekNumber(date);
                return `${year}-W${String(weekNumber).padStart(2, '0')}`;
            }
            case 'month':
            default:
                return `${year}-${month}`;
        }
    }

    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
