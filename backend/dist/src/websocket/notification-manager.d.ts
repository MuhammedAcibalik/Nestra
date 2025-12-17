/**
 * Notification Manager
 * Centralized service for managing live production tracking and stock alerts
 * Following SOLID principles with proper event handling
 */
import { IWebSocketService } from './websocket.service';
/** Production tracking update */
export interface IProductionTrackingUpdate {
    productionLogId: string;
    planNumber: string;
    operatorName: string;
    machineId?: string;
    machineName?: string;
    status: 'STARTED' | 'PAUSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    progress: number;
    currentPiece?: number;
    totalPieces?: number;
    estimatedTimeRemaining?: number;
    actualWaste?: number;
    timestamp: Date;
}
/** Stock alert configuration */
export interface IStockAlertConfig {
    materialTypeId: string;
    minQuantity: number;
    alertThreshold: number;
    enabled: boolean;
}
/** Stock alert data */
export interface IStockAlertData {
    stockItemId: string;
    stockCode: string;
    materialTypeName: string;
    currentQuantity: number;
    minQuantity: number;
    alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
    locationName?: string;
    timestamp: Date;
}
/** Downtime alert */
export interface IDowntimeAlertData {
    productionLogId: string;
    machineId: string;
    machineName: string;
    reason: string;
    startedAt: Date;
    durationMinutes: number;
    operatorName?: string;
}
/** Quality alert */
export interface IQualityAlertData {
    productionLogId: string;
    planNumber: string;
    result: 'FAIL' | 'PARTIAL';
    failedCount: number;
    defectTypes: string[];
    inspectorName?: string;
    timestamp: Date;
}
export interface INotificationManager {
    notifyProductionStarted(data: IProductionTrackingUpdate): void;
    notifyProductionProgress(data: IProductionTrackingUpdate): void;
    notifyProductionCompleted(data: IProductionTrackingUpdate): void;
    notifyProductionPaused(data: IProductionTrackingUpdate): void;
    notifyDowntimeStarted(data: IDowntimeAlertData): void;
    notifyDowntimeEnded(data: IDowntimeAlertData & {
        endedAt: Date;
    }): void;
    notifyStockLow(data: IStockAlertData): void;
    notifyStockCritical(data: IStockAlertData): void;
    notifyStockReplenished(data: IStockAlertData): void;
    notifyQualityIssue(data: IQualityAlertData): void;
    subscribeToProduction(userId: string, planIds: string[]): void;
    unsubscribeFromProduction(userId: string): void;
}
declare class NotificationManager implements INotificationManager {
    private readonly ws;
    private readonly productionSubscriptions;
    constructor(wsService: IWebSocketService);
    notifyProductionStarted(data: IProductionTrackingUpdate): void;
    notifyProductionProgress(data: IProductionTrackingUpdate): void;
    notifyProductionCompleted(data: IProductionTrackingUpdate): void;
    notifyProductionPaused(data: IProductionTrackingUpdate): void;
    notifyDowntimeStarted(data: IDowntimeAlertData): void;
    notifyDowntimeEnded(data: IDowntimeAlertData & {
        endedAt: Date;
    }): void;
    notifyStockLow(data: IStockAlertData): void;
    notifyStockCritical(data: IStockAlertData): void;
    notifyStockReplenished(data: IStockAlertData): void;
    notifyQualityIssue(data: IQualityAlertData): void;
    subscribeToProduction(userId: string, planIds: string[]): void;
    unsubscribeFromProduction(userId: string): void;
    getSubscribedPlanIds(userId: string): string[];
}
/**
 * Check if stock is below minimum threshold
 */
export declare function checkStockLevel(currentQuantity: number, minQuantity: number, alertThreshold?: number): 'OK' | 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
/**
 * Calculate production progress
 */
export declare function calculateProductionProgress(completedPieces: number, totalPieces: number): number;
/**
 * Estimate remaining time based on current progress
 */
export declare function estimateRemainingTime(startTime: Date, currentProgress: number): number;
export declare const notificationManager: NotificationManager;
export {};
//# sourceMappingURL=notification-manager.d.ts.map