/**
 * WebSocket Event Types
 * Type-safe event definitions for real-time notifications
 */

export enum WebSocketEvents {
    // Connection events
    CONNECTION = 'connection',
    DISCONNECT = 'disconnect',

    // Optimization events
    OPTIMIZATION_STARTED = 'optimization:started',
    OPTIMIZATION_PROGRESS = 'optimization:progress',
    OPTIMIZATION_COMPLETED = 'optimization:completed',
    OPTIMIZATION_FAILED = 'optimization:failed',

    // Production events
    PRODUCTION_STARTED = 'production:started',
    PRODUCTION_UPDATED = 'production:updated',
    PRODUCTION_COMPLETED = 'production:completed',
    PRODUCTION_PAUSED = 'production:paused',

    // Downtime events
    DOWNTIME_STARTED = 'downtime:started',
    DOWNTIME_ENDED = 'downtime:ended',

    // Stock events
    STOCK_LOW = 'stock:low',
    STOCK_CRITICAL = 'stock:critical',
    STOCK_UPDATED = 'stock:updated',
    STOCK_REPLENISHED = 'stock:replenished',

    // Quality events
    QUALITY_ISSUE = 'quality:issue',

    // Job events
    CUTTING_JOB_CREATED = 'cutting-job:created',
    CUTTING_JOB_STATUS_CHANGED = 'cutting-job:status-changed'
}

export interface IOptimizationStartedPayload {
    scenarioId: string;
    scenarioName: string;
    cuttingJobId: string;
    startedAt: Date;
}

export interface IOptimizationProgressPayload {
    scenarioId: string;
    progress: number; // 0-100
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

// ==================== PRODUCTION PAYLOADS ====================

export interface IProductionStartedPayload {
    productionLogId: string;
    planNumber: string;
    operatorName: string;
    machineId?: string;
    machineName?: string;
    startedAt: string;
}

export interface IProductionUpdatedPayload {
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
    productionLogId: string;
    planNumber: string;
    actualWaste: number;
    actualTime?: number;
    completedAt: string;
}

// ==================== STOCK PAYLOADS ====================

export interface IStockLowPayload {
    stockItemId: string;
    stockCode: string;
    materialTypeName: string;
    currentQuantity: number;
    minQuantity: number;
    alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
    locationName?: string;
}

export interface IStockUpdatedPayload {
    stockItemId: string;
    stockCode: string;
    newQuantity: number;
    previousQuantity?: number;
    changeType: 'PURCHASE' | 'CONSUMPTION' | 'ADJUSTMENT' | 'REPLENISHED';
}

// ==================== JOB PAYLOADS ====================

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

export type WebSocketPayload =
    | IOptimizationStartedPayload
    | IOptimizationProgressPayload
    | IOptimizationCompletedPayload
    | IOptimizationFailedPayload
    | IProductionStartedPayload
    | IProductionUpdatedPayload
    | IProductionCompletedPayload
    | IStockLowPayload
    | IStockUpdatedPayload
    | ICuttingJobCreatedPayload
    | ICuttingJobStatusChangedPayload;

