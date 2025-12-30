/**
 * Analytics Repository
 * Aggregated data access for analytics services
 */

import { Database } from '../../../db';
import { orders, orderItems, stockItems, stockMovements, productionLogs, cuttingPlans, MovementType } from '../../../db/schema';
import { sql, gte, lte, and, eq, desc, count, sum, avg } from 'drizzle-orm';
import { getCurrentTenantIdOptional } from '../../../core/tenant';
import { ITimeSeriesPoint, ForecastPeriod, ForecastMetric } from '../domain';
import { createModuleLogger } from '../../../core/logger';

const logger = createModuleLogger('AnalyticsRepository');

// ==================== TYPES ====================

export interface IAnalyticsFilter {
    startDate?: Date;
    endDate?: Date;
    materialTypeId?: string;
    customerId?: string;
    tenantId?: string;
}

export interface IAggregatedMetric {
    date: Date;
    value: number;
    count: number;
    label?: string;
}

export interface IStockConsumptionData {
    materialTypeId: string;
    materialName: string;
    totalConsumed: number;
    movementCount: number;
    averageDaily: number;
    currentStock: number;
    daysRemaining: number;
}

// ==================== INTERFACE ====================

export interface IAnalyticsRepository {
    getOrderTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]>;
    getStockConsumptionTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]>;
    getProductionTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]>;
    getWasteTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]>;
    getStockConsumptionByMaterial(filter: IAnalyticsFilter): Promise<IStockConsumptionData[]>;
    getAggregatedMetrics(metric: ForecastMetric, filter: IAnalyticsFilter): Promise<IAggregatedMetric[]>;
}

// ==================== IMPLEMENTATION ====================

export class AnalyticsRepository implements IAnalyticsRepository {
    constructor(private readonly db: Database) { }

    private getTenantId(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    private buildDateFilter(startDate?: Date, endDate?: Date) {
        const conditions = [];
        if (startDate) conditions.push(gte(orders.createdAt, startDate));
        if (endDate) conditions.push(lte(orders.createdAt, endDate));

        const tenantId = this.getTenantId();
        if (tenantId) conditions.push(eq(orders.tenantId, tenantId));

        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    /**
     * Get order count time series
     */
    async getOrderTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]> {
        const periodFormat = this.getPeriodFormat(period);

        const conditions = [];
        if (filter.startDate) conditions.push(gte(orders.createdAt, filter.startDate));
        if (filter.endDate) conditions.push(lte(orders.createdAt, filter.endDate));
        if (filter.customerId) conditions.push(eq(orders.customerId, filter.customerId));

        const tenantId = filter.tenantId ?? this.getTenantId();
        if (tenantId) conditions.push(eq(orders.tenantId, tenantId));

        const results = await this.db
            .select({
                period: sql<string>`to_char(${orders.createdAt}, ${periodFormat})`,
                value: count(orders.id)
            })
            .from(orders)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(sql`to_char(${orders.createdAt}, ${periodFormat})`)
            .orderBy(sql`to_char(${orders.createdAt}, ${periodFormat})`);

        return results.map(r => ({
            timestamp: this.parsePeriodToDate(r.period, period),
            value: Number(r.value),
            label: r.period
        }));
    }

    /**
     * Get stock consumption time series
     */
    async getStockConsumptionTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]> {
        const periodFormat = this.getPeriodFormat(period);

        const conditions = [];
        if (filter.startDate) conditions.push(gte(stockMovements.createdAt, filter.startDate));
        if (filter.endDate) conditions.push(lte(stockMovements.createdAt, filter.endDate));
        // Only consumption movements
        conditions.push(eq(stockMovements.movementType, 'CONSUME' as MovementType));

        const results = await this.db
            .select({
                period: sql<string>`to_char(${stockMovements.createdAt}, ${periodFormat})`,
                value: sum(stockMovements.quantity)
            })
            .from(stockMovements)
            .where(and(...conditions))
            .groupBy(sql`to_char(${stockMovements.createdAt}, ${periodFormat})`)
            .orderBy(sql`to_char(${stockMovements.createdAt}, ${periodFormat})`);

        return results.map(r => ({
            timestamp: this.parsePeriodToDate(r.period, period),
            value: Math.abs(Number(r.value ?? 0)),
            label: r.period
        }));
    }

    /**
     * Get production count time series
     */
    async getProductionTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]> {
        const periodFormat = this.getPeriodFormat(period);

        const conditions = [];
        if (filter.startDate) conditions.push(gte(productionLogs.createdAt, filter.startDate));
        if (filter.endDate) conditions.push(lte(productionLogs.createdAt, filter.endDate));

        const tenantId = filter.tenantId ?? this.getTenantId();
        if (tenantId) conditions.push(eq(productionLogs.tenantId, tenantId));

        const results = await this.db
            .select({
                period: sql<string>`to_char(${productionLogs.createdAt}, ${periodFormat})`,
                value: count(productionLogs.id)
            })
            .from(productionLogs)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(sql`to_char(${productionLogs.createdAt}, ${periodFormat})`)
            .orderBy(sql`to_char(${productionLogs.createdAt}, ${periodFormat})`);

        return results.map(r => ({
            timestamp: this.parsePeriodToDate(r.period, period),
            value: Number(r.value),
            label: r.period
        }));
    }

    /**
     * Get waste percentage time series
     */
    async getWasteTimeSeries(filter: IAnalyticsFilter, period: ForecastPeriod): Promise<ITimeSeriesPoint[]> {
        const periodFormat = this.getPeriodFormat(period);

        const conditions = [];
        if (filter.startDate) conditions.push(gte(cuttingPlans.createdAt, filter.startDate));
        if (filter.endDate) conditions.push(lte(cuttingPlans.createdAt, filter.endDate));

        // cuttingPlans doesn't have tenantId - filter via related order if needed

        const results = await this.db
            .select({
                period: sql<string>`to_char(${cuttingPlans.createdAt}, ${periodFormat})`,
                value: avg(cuttingPlans.wastePercentage)
            })
            .from(cuttingPlans)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(sql`to_char(${cuttingPlans.createdAt}, ${periodFormat})`)
            .orderBy(sql`to_char(${cuttingPlans.createdAt}, ${periodFormat})`);

        return results.map(r => ({
            timestamp: this.parsePeriodToDate(r.period, period),
            value: Number(r.value ?? 0),
            label: r.period
        }));
    }

    /**
     * Get stock consumption by material with predictions
     */
    async getStockConsumptionByMaterial(filter: IAnalyticsFilter): Promise<IStockConsumptionData[]> {
        // Get current stock levels
        const stockConditions = [];
        const tenantId = filter.tenantId ?? this.getTenantId();
        if (tenantId) stockConditions.push(eq(stockItems.tenantId, tenantId));

        const currentStock = await this.db.query.stockItems.findMany({
            where: stockConditions.length > 0 ? and(...stockConditions) : undefined,
            with: { materialType: true }
        });

        // Get consumption in period
        const movementConditions = [];
        if (filter.startDate) movementConditions.push(gte(stockMovements.createdAt, filter.startDate));
        if (filter.endDate) movementConditions.push(lte(stockMovements.createdAt, filter.endDate));
        movementConditions.push(eq(stockMovements.movementType, 'CONSUME' as MovementType));

        const consumptionData = await this.db
            .select({
                stockItemId: stockMovements.stockItemId,
                totalConsumed: sum(stockMovements.quantity),
                movementCount: count(stockMovements.id)
            })
            .from(stockMovements)
            .where(and(...movementConditions))
            .groupBy(stockMovements.stockItemId);

        // Calculate days in period
        const startDate = filter.startDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = filter.endDate ?? new Date();
        const daysInPeriod = Math.max(1, (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

        // Merge and calculate
        const consumptionMap = new Map(consumptionData.map(c => [c.stockItemId, c]));

        const result: IStockConsumptionData[] = [];
        const materialGroups = new Map<string, { totalStock: number; totalConsumed: number; movementCount: number; name: string }>();

        for (const stock of currentStock) {
            const consumption = consumptionMap.get(stock.id);
            const materialId = stock.materialTypeId;
            const existing = materialGroups.get(materialId) ?? {
                totalStock: 0,
                totalConsumed: 0,
                movementCount: 0,
                name: stock.materialType?.name ?? 'Unknown'
            };

            existing.totalStock += stock.quantity;
            existing.totalConsumed += Math.abs(Number(consumption?.totalConsumed ?? 0));
            existing.movementCount += Number(consumption?.movementCount ?? 0);
            materialGroups.set(materialId, existing);
        }

        for (const [materialId, data] of materialGroups) {
            const avgDaily = data.totalConsumed / daysInPeriod;
            const daysRemaining = avgDaily > 0 ? data.totalStock / avgDaily : 999;

            result.push({
                materialTypeId: materialId,
                materialName: data.name,
                totalConsumed: data.totalConsumed,
                movementCount: data.movementCount,
                averageDaily: Math.round(avgDaily * 100) / 100,
                currentStock: data.totalStock,
                daysRemaining: Math.round(daysRemaining)
            });
        }

        return result.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }

    /**
     * Get aggregated metrics
     */
    async getAggregatedMetrics(metric: ForecastMetric, filter: IAnalyticsFilter): Promise<IAggregatedMetric[]> {
        switch (metric) {
            case 'orders':
                return this.getOrderTimeSeries(filter, 'day').then(ts =>
                    ts.map(p => ({ date: p.timestamp, value: p.value, count: 1, label: p.label }))
                );
            case 'stock_consumption':
                return this.getStockConsumptionTimeSeries(filter, 'day').then(ts =>
                    ts.map(p => ({ date: p.timestamp, value: p.value, count: 1, label: p.label }))
                );
            case 'production':
                return this.getProductionTimeSeries(filter, 'day').then(ts =>
                    ts.map(p => ({ date: p.timestamp, value: p.value, count: 1, label: p.label }))
                );
            case 'waste':
            case 'efficiency':
                return this.getWasteTimeSeries(filter, 'day').then(ts =>
                    ts.map(p => ({ date: p.timestamp, value: p.value, count: 1, label: p.label }))
                );
            default:
                return [];
        }
    }

    // ==================== HELPERS ====================

    private getPeriodFormat(period: ForecastPeriod): string {
        switch (period) {
            case 'day': return 'YYYY-MM-DD';
            case 'week': return 'IYYY-IW';
            case 'month': return 'YYYY-MM';
        }
    }

    private parsePeriodToDate(period: string, periodType: ForecastPeriod): Date {
        try {
            switch (periodType) {
                case 'day':
                    return new Date(period);
                case 'week': {
                    const [year, week] = period.split('-W').map(Number);
                    const date = new Date(year, 0, 1);
                    date.setDate(date.getDate() + (week - 1) * 7);
                    return date;
                }
                case 'month': {
                    const [year, month] = period.split('-').map(Number);
                    return new Date(year, month - 1, 1);
                }
            }
        } catch {
            return new Date();
        }
    }
}
