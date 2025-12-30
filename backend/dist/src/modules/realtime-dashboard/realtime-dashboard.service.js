"use strict";
/**
 * Real-time Dashboard Service
 * Business logic for dashboard data aggregation and streaming
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeDashboardService = void 0;
const event_bus_1 = require("../../core/events/event-bus");
const logger_1 = require("../../core/logger");
const realtime_dashboard_events_1 = require("./realtime-dashboard.events");
const logger = (0, logger_1.createModuleLogger)('RealtimeDashboardService');
// ==================== SERVICE ====================
class RealtimeDashboardService {
    repository;
    eventBus;
    pollingIntervals = new Map();
    constructor(repository) {
        this.repository = repository;
        this.eventBus = event_bus_1.EventBus.getInstance();
        this.setupEventListeners();
    }
    // ==================== DATA RETRIEVAL ====================
    async getKPIs(tenantId) {
        const [activeProductions, pendingOptimizations, pendingOrders, lowStockAlerts, todayWastePercentage, todayCompletedPlans] = await Promise.all([
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
    async getStats(tenantId) {
        const [orders, production] = await Promise.all([
            this.repository.getOrderStats(tenantId),
            this.repository.getProductionStats(tenantId)
        ]);
        return { orders, production };
    }
    async getActiveProductions(tenantId) {
        return this.repository.getActiveProductions(tenantId);
    }
    async getRunningOptimizations(tenantId) {
        return this.repository.getRunningOptimizations(tenantId);
    }
    async getLowStockAlerts(tenantId) {
        return this.repository.getLowStockItems(tenantId);
    }
    async getRecentActivities(tenantId, limit = 20) {
        return this.repository.getRecentActivities(tenantId, limit);
    }
    // ==================== BROADCASTING ====================
    async broadcastKPIUpdate(tenantId) {
        try {
            const kpis = await this.getKPIs(tenantId);
            const payload = {
                tenantId,
                timestamp: new Date().toISOString(),
                kpis
            };
            await this.eventBus.publish({
                eventId: `kpi_${Date.now()}`,
                eventType: realtime_dashboard_events_1.DashboardEvents.KPI_UPDATE,
                timestamp: new Date(),
                aggregateType: 'Dashboard',
                aggregateId: tenantId,
                payload: payload
            });
            logger.debug('KPI update broadcast', { tenantId });
        }
        catch (error) {
            logger.error('Failed to broadcast KPI update', { error, tenantId });
        }
    }
    async broadcastStatsUpdate(tenantId) {
        try {
            const { orders, production } = await this.getStats(tenantId);
            const payload = {
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
                eventType: realtime_dashboard_events_1.DashboardEvents.STATS_UPDATE,
                timestamp: new Date(),
                aggregateType: 'Dashboard',
                aggregateId: tenantId,
                payload: payload
            });
            logger.debug('Stats update broadcast', { tenantId });
        }
        catch (error) {
            logger.error('Failed to broadcast stats update', { error, tenantId });
        }
    }
    broadcastProductionUpdate(payload) {
        this.eventBus
            .publish({
            eventId: `prod_${Date.now()}`,
            eventType: realtime_dashboard_events_1.DashboardEvents.PRODUCTION_PROGRESS,
            timestamp: new Date(),
            aggregateType: 'ProductionLog',
            aggregateId: payload.productionLogId,
            payload: payload
        })
            .catch((error) => {
            logger.error('Failed to broadcast production update', { error });
        });
    }
    broadcastOptimizationUpdate(payload) {
        const eventType = payload.status === 'COMPLETED'
            ? realtime_dashboard_events_1.DashboardEvents.OPTIMIZATION_COMPLETED
            : payload.status === 'FAILED'
                ? realtime_dashboard_events_1.DashboardEvents.OPTIMIZATION_FAILED
                : realtime_dashboard_events_1.DashboardEvents.OPTIMIZATION_RUNNING;
        this.eventBus
            .publish({
            eventId: `opt_${Date.now()}`,
            eventType,
            timestamp: new Date(),
            aggregateType: 'OptimizationScenario',
            aggregateId: payload.scenarioId,
            payload: payload
        })
            .catch((error) => {
            logger.error('Failed to broadcast optimization update', { error });
        });
    }
    broadcastStockAlert(payload) {
        this.eventBus
            .publish({
            eventId: `stock_${Date.now()}`,
            eventType: realtime_dashboard_events_1.DashboardEvents.STOCK_ALERT,
            timestamp: new Date(),
            aggregateType: 'StockItem',
            aggregateId: payload.stockItemId,
            payload: payload
        })
            .catch((error) => {
            logger.error('Failed to broadcast stock alert', { error });
        });
    }
    broadcastActivity(payload) {
        this.eventBus
            .publish({
            eventId: `activity_${Date.now()}`,
            eventType: realtime_dashboard_events_1.DashboardEvents.ACTIVITY_NEW,
            timestamp: new Date(),
            aggregateType: 'Activity',
            aggregateId: payload.activityId,
            payload: payload
        })
            .catch((error) => {
            logger.error('Failed to broadcast activity', { error });
        });
    }
    // ==================== POLLING ====================
    startKPIPolling(tenantId, intervalMs = 30000) {
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
    stopKPIPolling(tenantId) {
        const interval = this.pollingIntervals.get(tenantId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(tenantId);
            logger.info('KPI polling stopped', { tenantId });
        }
    }
    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Listen for domain events and broadcast to dashboard
        this.eventBus.subscribe('PRODUCTION_STARTED', async (event) => {
            const tenantId = event.payload.tenantId;
            if (tenantId) {
                await this.broadcastKPIUpdate(tenantId);
            }
        });
        this.eventBus.subscribe('PRODUCTION_COMPLETED', async (event) => {
            const tenantId = event.payload.tenantId;
            if (tenantId) {
                await this.broadcastKPIUpdate(tenantId);
            }
        });
        this.eventBus.subscribe('OPTIMIZATION_COMPLETED', async (event) => {
            const tenantId = event.payload.tenantId;
            if (tenantId) {
                await this.broadcastKPIUpdate(tenantId);
            }
        });
        this.eventBus.subscribe('ORDER_CREATED', async (event) => {
            const tenantId = event.payload.tenantId;
            if (tenantId) {
                await this.broadcastStatsUpdate(tenantId);
            }
        });
        this.eventBus.subscribe('STOCK_LOW', async (event) => {
            const payload = event.payload;
            const tenantId = payload.tenantId;
            if (tenantId) {
                this.broadcastStockAlert({
                    tenantId,
                    stockItemId: payload.stockItemId,
                    stockCode: payload.stockCode,
                    materialName: payload.materialName,
                    currentQuantity: payload.currentQuantity,
                    minQuantity: payload.minQuantity,
                    alertLevel: payload.alertLevel,
                    timestamp: new Date().toISOString()
                });
            }
        });
        logger.info('Dashboard event listeners initialized');
    }
    // ==================== CLEANUP ====================
    destroy() {
        // Stop all polling intervals
        for (const [tenantId, interval] of this.pollingIntervals.entries()) {
            clearInterval(interval);
            logger.info('Polling stopped during cleanup', { tenantId });
        }
        this.pollingIntervals.clear();
    }
}
exports.RealtimeDashboardService = RealtimeDashboardService;
//# sourceMappingURL=realtime-dashboard.service.js.map