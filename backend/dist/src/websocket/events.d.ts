/**
 * WebSocket Event Types
 * Type-safe event definitions for real-time notifications
 */
export declare enum WebSocketEvents {
    CONNECTION = "connection",
    DISCONNECT = "disconnect",
    OPTIMIZATION_STARTED = "optimization:started",
    OPTIMIZATION_PROGRESS = "optimization:progress",
    OPTIMIZATION_COMPLETED = "optimization:completed",
    OPTIMIZATION_FAILED = "optimization:failed",
    PRODUCTION_STARTED = "production:started",
    PRODUCTION_UPDATED = "production:updated",
    PRODUCTION_COMPLETED = "production:completed",
    PRODUCTION_PAUSED = "production:paused",
    DOWNTIME_STARTED = "downtime:started",
    DOWNTIME_ENDED = "downtime:ended",
    STOCK_LOW = "stock:low",
    STOCK_CRITICAL = "stock:critical",
    STOCK_UPDATED = "stock:updated",
    STOCK_REPLENISHED = "stock:replenished",
    QUALITY_ISSUE = "quality:issue",
    CUTTING_JOB_CREATED = "cutting-job:created",
    CUTTING_JOB_STATUS_CHANGED = "cutting-job:status-changed"
}
export interface IOptimizationStartedPayload {
    tenantId?: string;
    scenarioId: string;
    scenarioName: string;
    cuttingJobId: string;
    startedAt: Date;
}
export interface IOptimizationProgressPayload {
    tenantId?: string;
    scenarioId: string;
    progress: number;
    message: string;
}
export interface IOptimizationCompletedPayload {
    tenantId?: string;
    scenarioId: string;
    planId: string;
    planNumber: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    completedAt: Date;
}
export interface IOptimizationFailedPayload {
    tenantId?: string;
    scenarioId: string;
    error: string;
    failedAt: Date;
}
export interface IProductionStartedPayload {
    tenantId?: string;
    productionLogId: string;
    planNumber: string;
    operatorName: string;
    machineId?: string;
    machineName?: string;
    startedAt: string;
}
export interface IProductionUpdatedPayload {
    tenantId?: string;
    productionLogId: string;
    status: string;
    progress?: number;
    currentPiece?: number;
    totalPieces?: number;
    estimatedTimeRemaining?: number;
    downtimeInfo?: Record<string, unknown>;
    qualityAlert?: Record<string, unknown>;
}
export interface IProductionCompletedPayload {
    tenantId?: string;
    productionLogId: string;
    planNumber: string;
    actualWaste: number;
    actualTime?: number;
    completedAt: string;
}
export interface IStockLowPayload {
    tenantId?: string;
    stockItemId: string;
    stockCode: string;
    materialTypeName: string;
    currentQuantity: number;
    minQuantity: number;
    alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
    locationName?: string;
}
export interface IStockUpdatedPayload {
    tenantId?: string;
    stockItemId: string;
    stockCode: string;
    newQuantity: number;
    previousQuantity?: number;
    changeType: 'PURCHASE' | 'CONSUMPTION' | 'ADJUSTMENT' | 'REPLENISHED';
}
export interface ICuttingJobCreatedPayload {
    tenantId?: string;
    jobId: string;
    jobNumber: string;
    materialType: string;
    thickness: number;
    itemCount: number;
}
export interface ICuttingJobStatusChangedPayload {
    tenantId?: string;
    jobId: string;
    jobNumber: string;
    previousStatus: string;
    newStatus: string;
}
export type WebSocketPayload = IOptimizationStartedPayload | IOptimizationProgressPayload | IOptimizationCompletedPayload | IOptimizationFailedPayload | IProductionStartedPayload | IProductionUpdatedPayload | IProductionCompletedPayload | IStockLowPayload | IStockUpdatedPayload | ICuttingJobCreatedPayload | ICuttingJobStatusChangedPayload;
//# sourceMappingURL=events.d.ts.map