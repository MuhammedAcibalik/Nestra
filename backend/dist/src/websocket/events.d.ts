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
    STOCK_LOW = "stock:low",
    STOCK_UPDATED = "stock:updated",
    CUTTING_JOB_CREATED = "cutting-job:created",
    CUTTING_JOB_STATUS_CHANGED = "cutting-job:status-changed"
}
export interface IOptimizationStartedPayload {
    scenarioId: string;
    scenarioName: string;
    cuttingJobId: string;
    startedAt: Date;
}
export interface IOptimizationProgressPayload {
    scenarioId: string;
    progress: number;
    message: string;
}
export interface IOptimizationCompletedPayload {
    scenarioId: string;
    planId: string;
    planNumber: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    completedAt: Date;
}
export interface IOptimizationFailedPayload {
    scenarioId: string;
    error: string;
    failedAt: Date;
}
export interface IProductionStartedPayload {
    planId: string;
    planNumber: string;
    operatorId: string;
    startedAt: Date;
}
export interface IProductionUpdatedPayload {
    planId: string;
    status: string;
    progress?: number;
}
export interface IProductionCompletedPayload {
    planId: string;
    planNumber: string;
    actualWaste?: number;
    completedAt: Date;
}
export interface IStockLowPayload {
    stockItemId: string;
    stockCode: string;
    stockName: string;
    quantity: number;
    threshold: number;
}
export interface IStockUpdatedPayload {
    stockItemId: string;
    stockCode: string;
    previousQty: number;
    newQty: number;
}
export interface ICuttingJobCreatedPayload {
    jobId: string;
    jobNumber: string;
    materialType: string;
    thickness: number;
    itemCount: number;
}
export interface ICuttingJobStatusChangedPayload {
    jobId: string;
    jobNumber: string;
    previousStatus: string;
    newStatus: string;
}
export type WebSocketPayload = IOptimizationStartedPayload | IOptimizationProgressPayload | IOptimizationCompletedPayload | IOptimizationFailedPayload | IProductionStartedPayload | IProductionUpdatedPayload | IProductionCompletedPayload | IStockLowPayload | IStockUpdatedPayload | ICuttingJobCreatedPayload | ICuttingJobStatusChangedPayload;
//# sourceMappingURL=events.d.ts.map