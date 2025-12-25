/**
 * Real-time Dashboard Service
 * Business logic for dashboard data aggregation and streaming
 * Following Single Responsibility Principle (SRP)
 */

import { EventBus } from '../../core/events/event-bus';
import { createModuleLogger } from '../../core/logger';
import {
    IDashboardRepository,
    IActiveProduction,
    IRunningOptimization,
    ILowStockItem,
    IRecentActivity,
    IOrderStats,
    IProductionStats
} from './realtime-dashboard.repository';
import {
    DashboardEvents,
    IKPIUpdatePayload,
    IStatsUpdatePayload,
    IProductionUpdatePayload,
    IOptimizationUpdatePayload,
    IStockAlertPayload,
    IActivityPayload
} from './realtime-dashboard.events';

const logger = createModuleLogger('RealtimeDashboardService');

// ==================== INTERFACES ====================

export interface IRealtimeDashboardService {
    // Data retrieval
    getKPIs(tenantId: string): Promise<IDashboardKPIs>;
    getStats(tenantId: string): Promise<IDashboardStats>;
    getActiveProductions(tenantId: string): Promise<IActiveProduction[]>;
    getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]>;
    getLowStockAlerts(tenantId: string): Promise<ILowStockItem[]>;
    getRecentActivities(tenantId: string, limit?: number): Promise<IRecentActivity[]>;

    // Broadcasting
    broadcastKPIUpdate(tenantId: string): Promise<void>;
    broadcastStatsUpdate(tenantId: string): Promise<void>;
    broadcastProductionUpdate(payload: IProductionUpdatePayload): void;
    broadcastOptimizationUpdate(payload: IOptimizationUpdatePayload): void;
    broadcastStockAlert(payload: IStockAlertPayload): void;
    broadcastActivity(payload: IActivityPayload): void;

    // Subscription management
    startKPIPolling(tenantId: string, intervalMs?: number): void;
    stopKPIPolling(tenantId: string): void;
}

export interface IDashboardKPIs {
    readonly activeProductions: number;
    readonly pendingOptimizations: number;
    readonly pendingOrders: number;
    readonly lowStockAlerts: number;
    readonly todayWastePercentage: number;
    readonly todayCompletedPlans: number;
}

export interface IDashboardStats {
    readonly orders: IOrderStats;
    readonly production: IProductionStats;
}

// ==================== SERVICE ====================

export class RealtimeDashboardService implements IRealtimeDashboardService {
    private readonly eventBus: EventBus;
    private readonly pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor(private readonly repository: IDashboardRepository) {
        this.eventBus = EventBus.getInstance();
        this.setupEventListeners();
    }

    // ==================== DATA RETRIEVAL ====================

    async getKPIs(tenantId: string): Promise<IDashboardKPIs> {
        const [
            activeProductions,
            pendingOptimizations,
            pendingOrders,
            lowStockAlerts,
            todayWastePercentage,
            todayCompletedPlans
        ] = await Promise.all([
            this.repository.getActiveProductionCount(tenantId),
            this.repository.getPendingOptimizationCount(tenantId),
            this.repository.getPendingOrderCount(tenantId),
            this.repository.getLowStockCount(tenantId),
            this.repository.getTodayWastePercentage(tenantId),
            this.repository.getTodayCompletedPlanCount(tenantId)
        ]);

        return {
            activeProductions,
            pendingOptimizations,
            pendingOrders,
            lowStockAlerts,
            todayWastePercentage: Math.round(todayWastePercentage * 100) / 100,
            todayCompletedPlans
        };
    }

    async getStats(tenantId: string): Promise<IDashboardStats> {
        const [orders, production] = await Promise.all([
            this.repository.getOrderStats(tenantId),
            this.repository.getProductionStats(tenantId)
        ]);

        return { orders, production };
    }

    async getActiveProductions(tenantId: string): Promise<IActiveProduction[]> {
        return this.repository.getActiveProductions(tenantId);
    }

    async getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]> {
        return this.repository.getRunningOptimizations(tenantId);
    }

    async getLowStockAlerts(tenantId: string): Promise<ILowStockItem[]> {
        return this.repository.getLowStockItems(tenantId);
    }

    async getRecentActivities(tenantId: string, limit = 20): Promise<IRecentActivity[]> {
        return this.repository.getRecentActivities(tenantId, limit);
    }

    // ==================== BROADCASTING ====================

    async broadcastKPIUpdate(tenantId: string): Promise<void> {
        try {
            const kpis = await this.getKPIs(tenantId);
            const payload: IKPIUpdatePayload = {
                tenantId,
                timestamp: new Date().toISOString(),
                kpis
            };

            await this.eventBus.publish({
                eventId: `kpi_${Date.now()}`,
                eventType: DashboardEvents.KPI_UPDATE,
                timestamp: new Date(),
                aggregateType: 'Dashboard',
                aggregateId: tenantId,
                payload: payload as unknown as Record<string, unknown>
            });

            logger.debug('KPI update broadcast', { tenantId });
        } catch (error) {
            logger.error('Failed to broadcast KPI update', { error, tenantId });
        }
    }

    async broadcastStatsUpdate(tenantId: string): Promise<void> {
        try {
            const { orders, production } = await this.getStats(tenantId);
            const payload: IStatsUpdatePayload = {
                tenantId,
                timestamp: new Date().toISOString(),
                orders: {
                    total: orders.total,
                    pending: orders.pending,
                    inProgress: orders.inProgress,
                    completed: orders.completed
                },
                production: {
                    active: production.active,
                    completed: production.completed,
                    paused: production.paused
                },
                stock: {
                    lowStock: 0, // Would need additional query
                    criticalStock: 0
                }
            };

            await this.eventBus.publish({
                eventId: `stats_${Date.now()}`,
                eventType: DashboardEvents.STATS_UPDATE,
                timestamp: new Date(),
                aggregateType: 'Dashboard',
                aggregateId: tenantId,
                payload: payload as unknown as Record<string, unknown>
            });

            logger.debug('Stats update broadcast', { tenantId });
        } catch (error) {
            logger.error('Failed to broadcast stats update', { error, tenantId });
        }
    }

    broadcastProductionUpdate(payload: IProductionUpdatePayload): void {
        this.eventBus
            .publish({
                eventId: `prod_${Date.now()}`,
                eventType: DashboardEvents.PRODUCTION_PROGRESS,
                timestamp: new Date(),
                aggregateType: 'ProductionLog',
                aggregateId: payload.productionLogId,
                payload: payload as unknown as Record<string, unknown>
            })
            .catch((error) => {
                logger.error('Failed to broadcast production update', { error });
            });
    }

    broadcastOptimizationUpdate(payload: IOptimizationUpdatePayload): void {
        const eventType =
            payload.status === 'COMPLETED'
                ? DashboardEvents.OPTIMIZATION_COMPLETED
                : payload.status === 'FAILED'
                  ? DashboardEvents.OPTIMIZATION_FAILED
                  : DashboardEvents.OPTIMIZATION_RUNNING;

        this.eventBus
            .publish({
                eventId: `opt_${Date.now()}`,
                eventType,
                timestamp: new Date(),
                aggregateType: 'OptimizationScenario',
                aggregateId: payload.scenarioId,
                payload: payload as unknown as Record<string, unknown>
            })
            .catch((error) => {
                logger.error('Failed to broadcast optimization update', { error });
            });
    }

    broadcastStockAlert(payload: IStockAlertPayload): void {
        this.eventBus
            .publish({
                eventId: `stock_${Date.now()}`,
                eventType: DashboardEvents.STOCK_ALERT,
                timestamp: new Date(),
                aggregateType: 'StockItem',
                aggregateId: payload.stockItemId,
                payload: payload as unknown as Record<string, unknown>
            })
            .catch((error) => {
                logger.error('Failed to broadcast stock alert', { error });
            });
    }

    broadcastActivity(payload: IActivityPayload): void {
        this.eventBus
            .publish({
                eventId: `activity_${Date.now()}`,
                eventType: DashboardEvents.ACTIVITY_NEW,
                timestamp: new Date(),
                aggregateType: 'Activity',
                aggregateId: payload.activityId,
                payload: payload as unknown as Record<string, unknown>
            })
            .catch((error) => {
                logger.error('Failed to broadcast activity', { error });
            });
    }

    // ==================== POLLING ====================

    startKPIPolling(tenantId: string, intervalMs = 30000): void {
        // Clear existing interval if any
        this.stopKPIPolling(tenantId);

        // Start new polling interval
        const interval = setInterval(() => {
            this.broadcastKPIUpdate(tenantId).catch((error) => {
                logger.error('KPI polling failed', { error, tenantId });
            });
        }, intervalMs);

        this.pollingIntervals.set(tenantId, interval);
        logger.info('KPI polling started', { tenantId, intervalMs });

        // Broadcast immediately
        this.broadcastKPIUpdate(tenantId).catch((error) => {
            logger.warn('Initial KPI broadcast failed', { tenantId, error });
        });
    }

    stopKPIPolling(tenantId: string): void {
        const interval = this.pollingIntervals.get(tenantId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(tenantId);
            logger.info('KPI polling stopped', { tenantId });
        }
    }

    // ==================== EVENT LISTENERS ====================

    private setupEventListeners(): void {
        // Listen for domain events and broadcast to dashboard
        this.eventBus.subscribe('PRODUCTION_STARTED', async (event) => {
            const tenantId = (event.payload as Record<string, string>).tenantId;
            if (tenantId) {
                await this.broadcastKPIUpdate(tenantId);
            }
        });

        this.eventBus.subscribe('PRODUCTION_COMPLETED', async (event) => {
            const tenantId = (event.payload as Record<string, string>).tenantId;
            if (tenantId) {
                await this.broadcastKPIUpdate(tenantId);
            }
        });

        this.eventBus.subscribe('OPTIMIZATION_COMPLETED', async (event) => {
            const tenantId = (event.payload as Record<string, string>).tenantId;
            if (tenantId) {
                await this.broadcastKPIUpdate(tenantId);
            }
        });

        this.eventBus.subscribe('ORDER_CREATED', async (event) => {
            const tenantId = (event.payload as Record<string, string>).tenantId;
            if (tenantId) {
                await this.broadcastStatsUpdate(tenantId);
            }
        });

        this.eventBus.subscribe('STOCK_LOW', async (event) => {
            const payload = event.payload as Record<string, unknown>;
            const tenantId = payload.tenantId as string;
            if (tenantId) {
                this.broadcastStockAlert({
                    tenantId,
                    stockItemId: payload.stockItemId as string,
                    stockCode: payload.stockCode as string,
                    materialName: payload.materialName as string,
                    currentQuantity: payload.currentQuantity as number,
                    minQuantity: payload.minQuantity as number,
                    alertLevel: payload.alertLevel as 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK',
                    timestamp: new Date().toISOString()
                });
            }
        });

        logger.info('Dashboard event listeners initialized');
    }

    // ==================== CLEANUP ====================

    destroy(): void {
        // Stop all polling intervals
        for (const [tenantId, interval] of this.pollingIntervals.entries()) {
            clearInterval(interval);
            logger.info('Polling stopped during cleanup', { tenantId });
        }
        this.pollingIntervals.clear();
    }
}
