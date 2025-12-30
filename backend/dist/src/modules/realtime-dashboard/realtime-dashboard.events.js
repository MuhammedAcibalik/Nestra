"use strict";
/**
 * Real-time Dashboard Events
 * Event definitions for dashboard WebSocket communication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardEvents = void 0;
// ==================== EVENT TYPES ====================
exports.DashboardEvents = {
    // Connection
    SUBSCRIBE: 'dashboard:subscribe',
    UNSUBSCRIBE: 'dashboard:unsubscribe',
    SUBSCRIBED: 'dashboard:subscribed',
    // KPI Updates
    KPI_UPDATE: 'dashboard:kpi_update',
    STATS_UPDATE: 'dashboard:stats_update',
    // Production
    PRODUCTION_STARTED: 'dashboard:production_started',
    PRODUCTION_PROGRESS: 'dashboard:production_progress',
    PRODUCTION_COMPLETED: 'dashboard:production_completed',
    PRODUCTION_PAUSED: 'dashboard:production_paused',
    // Optimization
    OPTIMIZATION_QUEUED: 'dashboard:optimization_queued',
    OPTIMIZATION_RUNNING: 'dashboard:optimization_running',
    OPTIMIZATION_PROGRESS: 'dashboard:optimization_progress',
    OPTIMIZATION_COMPLETED: 'dashboard:optimization_completed',
    OPTIMIZATION_FAILED: 'dashboard:optimization_failed',
    // Orders & Jobs
    ORDER_CREATED: 'dashboard:order_created',
    ORDER_UPDATED: 'dashboard:order_updated',
    CUTTING_JOB_CREATED: 'dashboard:cutting_job_created',
    CUTTING_JOB_STATUS: 'dashboard:cutting_job_status',
    // Alerts
    STOCK_ALERT: 'dashboard:stock_alert',
    MACHINE_ALERT: 'dashboard:machine_alert',
    QUALITY_ALERT: 'dashboard:quality_alert',
    // Activity
    ACTIVITY_NEW: 'dashboard:activity_new'
};
//# sourceMappingURL=realtime-dashboard.events.js.map