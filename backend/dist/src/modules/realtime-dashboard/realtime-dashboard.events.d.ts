/**
 * Real-time Dashboard Events
 * Event definitions for dashboard WebSocket communication
 */
export declare const DashboardEvents: {
    readonly SUBSCRIBE: "dashboard:subscribe";
    readonly UNSUBSCRIBE: "dashboard:unsubscribe";
    readonly SUBSCRIBED: "dashboard:subscribed";
    readonly KPI_UPDATE: "dashboard:kpi_update";
    readonly STATS_UPDATE: "dashboard:stats_update";
    readonly PRODUCTION_STARTED: "dashboard:production_started";
    readonly PRODUCTION_PROGRESS: "dashboard:production_progress";
    readonly PRODUCTION_COMPLETED: "dashboard:production_completed";
    readonly PRODUCTION_PAUSED: "dashboard:production_paused";
    readonly OPTIMIZATION_QUEUED: "dashboard:optimization_queued";
    readonly OPTIMIZATION_RUNNING: "dashboard:optimization_running";
    readonly OPTIMIZATION_PROGRESS: "dashboard:optimization_progress";
    readonly OPTIMIZATION_COMPLETED: "dashboard:optimization_completed";
    readonly OPTIMIZATION_FAILED: "dashboard:optimization_failed";
    readonly ORDER_CREATED: "dashboard:order_created";
    readonly ORDER_UPDATED: "dashboard:order_updated";
    readonly CUTTING_JOB_CREATED: "dashboard:cutting_job_created";
    readonly CUTTING_JOB_STATUS: "dashboard:cutting_job_status";
    readonly STOCK_ALERT: "dashboard:stock_alert";
    readonly MACHINE_ALERT: "dashboard:machine_alert";
    readonly QUALITY_ALERT: "dashboard:quality_alert";
    readonly ACTIVITY_NEW: "dashboard:activity_new";
};
export type DashboardEventType = typeof DashboardEvents[keyof typeof DashboardEvents];
export interface IKPIUpdatePayload {
    readonly tenantId: string;
    readonly timestamp: string;
    readonly kpis: {
        readonly activeProductions: number;
        readonly pendingOptimizations: number;
        readonly pendingOrders: number;
        readonly lowStockAlerts: number;
        readonly todayWastePercentage: number;
        readonly todayCompletedPlans: number;
    };
}
export interface IStatsUpdatePayload {
    readonly tenantId: string;
    readonly timestamp: string;
    readonly orders: {
        readonly total: number;
        readonly pending: number;
        readonly inProgress: number;
        readonly completed: number;
    };
    readonly production: {
        readonly active: number;
        readonly completed: number;
        readonly paused: number;
    };
    readonly stock: {
        readonly lowStock: number;
        readonly criticalStock: number;
    };
}
export interface IProductionUpdatePayload {
    readonly tenantId: string;
    readonly productionLogId: string;
    readonly cuttingPlanId: string;
    readonly planNumber: string;
    readonly status: 'STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
    readonly progress: number;
    readonly currentPiece?: number;
    readonly totalPieces?: number;
    readonly operatorName: string;
    readonly machineName?: string;
    readonly estimatedCompletion?: string;
    readonly timestamp: string;
}
export interface IOptimizationUpdatePayload {
    readonly tenantId: string;
    readonly scenarioId: string;
    readonly scenarioName: string;
    readonly status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    readonly progress?: number;
    readonly message?: string;
    readonly result?: {
        readonly planCount: number;
        readonly wastePercentage: number;
        readonly stockUsed: number;
    };
    readonly timestamp: string;
}
export interface IOrderUpdatePayload {
    readonly tenantId: string;
    readonly orderId: string;
    readonly orderNumber: string;
    readonly status: string;
    readonly itemCount: number;
    readonly customerName?: string;
    readonly action: 'created' | 'updated' | 'cancelled' | 'completed';
    readonly timestamp: string;
}
export interface ICuttingJobUpdatePayload {
    readonly tenantId: string;
    readonly jobId: string;
    readonly jobNumber: string;
    readonly status: string;
    readonly materialType: string;
    readonly pieceCount: number;
    readonly action: 'created' | 'status_changed' | 'assigned';
    readonly timestamp: string;
}
export interface IStockAlertPayload {
    readonly tenantId: string;
    readonly stockItemId: string;
    readonly stockCode: string;
    readonly materialName: string;
    readonly currentQuantity: number;
    readonly minQuantity: number;
    readonly alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
    readonly locationName?: string;
    readonly timestamp: string;
}
export interface IMachineAlertPayload {
    readonly tenantId: string;
    readonly machineId: string;
    readonly machineName: string;
    readonly alertType: 'DOWNTIME' | 'MAINTENANCE' | 'ERROR';
    readonly message: string;
    readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
    readonly timestamp: string;
}
export interface IActivityPayload {
    readonly tenantId: string;
    readonly activityId: string;
    readonly activityType: string;
    readonly actorId: string;
    readonly actorName: string;
    readonly targetType?: string;
    readonly targetId?: string;
    readonly targetName?: string;
    readonly message: string;
    readonly timestamp: string;
}
//# sourceMappingURL=realtime-dashboard.events.d.ts.map