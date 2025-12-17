/**
 * Notification Manager
 * Centralized service for managing live production tracking and stock alerts
 * Following SOLID principles with proper event handling
 */

import { websocketService, IWebSocketService } from './websocket.service';
import {
    IProductionStartedPayload,
    IProductionUpdatedPayload,
    IProductionCompletedPayload,
    IStockLowPayload,
    IStockUpdatedPayload
} from './events';

// ==================== INTERFACES ====================

/** Production tracking update */
export interface IProductionTrackingUpdate {
    productionLogId: string;
    planNumber: string;
    operatorName: string;
    machineId?: string;
    machineName?: string;
    status: 'STARTED' | 'PAUSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    progress: number; // 0-100
    currentPiece?: number;
    totalPieces?: number;
    estimatedTimeRemaining?: number; // minutes
    actualWaste?: number;
    timestamp: Date;
}

/** Stock alert configuration */
export interface IStockAlertConfig {
    materialTypeId: string;
    minQuantity: number;
    alertThreshold: number; // percentage above min before warning
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

// ==================== NOTIFICATION MANAGER ====================

export interface INotificationManager {
    // Production tracking
    notifyProductionStarted(data: IProductionTrackingUpdate): void;
    notifyProductionProgress(data: IProductionTrackingUpdate): void;
    notifyProductionCompleted(data: IProductionTrackingUpdate): void;
    notifyProductionPaused(data: IProductionTrackingUpdate): void;

    // Downtime alerts
    notifyDowntimeStarted(data: IDowntimeAlertData): void;
    notifyDowntimeEnded(data: IDowntimeAlertData & { endedAt: Date }): void;

    // Stock alerts
    notifyStockLow(data: IStockAlertData): void;
    notifyStockCritical(data: IStockAlertData): void;
    notifyStockReplenished(data: IStockAlertData): void;

    // Quality alerts
    notifyQualityIssue(data: IQualityAlertData): void;

    // Subscriptions
    subscribeToProduction(userId: string, planIds: string[]): void;
    unsubscribeFromProduction(userId: string): void;
}

class NotificationManager implements INotificationManager {
    private readonly ws: IWebSocketService;
    private readonly productionSubscriptions: Map<string, Set<string>> = new Map(); // userId -> planIds

    constructor(wsService: IWebSocketService) {
        this.ws = wsService;
    }

    // ==================== PRODUCTION TRACKING ====================

    notifyProductionStarted(data: IProductionTrackingUpdate): void {
        const payload: IProductionStartedPayload = {
            productionLogId: data.productionLogId,
            planNumber: data.planNumber,
            operatorName: data.operatorName,
            startedAt: data.timestamp.toISOString()
        };

        this.ws.emitProductionStarted(payload);
        console.log(`[Notification] Production started: ${data.planNumber}`);
    }

    notifyProductionProgress(data: IProductionTrackingUpdate): void {
        const payload: IProductionUpdatedPayload = {
            productionLogId: data.productionLogId,
            status: data.status,
            progress: data.progress,
            currentPiece: data.currentPiece,
            totalPieces: data.totalPieces,
            estimatedTimeRemaining: data.estimatedTimeRemaining
        };

        this.ws.emitProductionUpdated(payload);
    }

    notifyProductionCompleted(data: IProductionTrackingUpdate): void {
        const payload: IProductionCompletedPayload = {
            productionLogId: data.productionLogId,
            planNumber: data.planNumber,
            actualWaste: data.actualWaste ?? 0,
            completedAt: data.timestamp.toISOString()
        };

        this.ws.emitProductionCompleted(payload);
        console.log(`[Notification] Production completed: ${data.planNumber}`);
    }

    notifyProductionPaused(data: IProductionTrackingUpdate): void {
        const payload: IProductionUpdatedPayload = {
            productionLogId: data.productionLogId,
            status: 'PAUSED',
            progress: data.progress
        };

        this.ws.emitProductionUpdated(payload);
        console.log(`[Notification] Production paused: ${data.planNumber}`);
    }

    // ==================== DOWNTIME ALERTS ====================

    notifyDowntimeStarted(data: IDowntimeAlertData): void {
        const payload = {
            type: 'DOWNTIME_STARTED',
            productionLogId: data.productionLogId,
            machineId: data.machineId,
            machineName: data.machineName,
            reason: data.reason,
            startedAt: data.startedAt.toISOString(),
            operatorName: data.operatorName,
            timestamp: new Date().toISOString()
        };

        // Emit as production update with custom type
        this.ws.emitProductionUpdated({
            productionLogId: data.productionLogId,
            status: 'PAUSED',
            downtimeInfo: payload
        } as IProductionUpdatedPayload);

        console.log(`[Notification] Downtime started on ${data.machineName}: ${data.reason}`);
    }

    notifyDowntimeEnded(data: IDowntimeAlertData & { endedAt: Date }): void {
        const payload = {
            type: 'DOWNTIME_ENDED',
            productionLogId: data.productionLogId,
            machineId: data.machineId,
            machineName: data.machineName,
            reason: data.reason,
            durationMinutes: data.durationMinutes,
            endedAt: data.endedAt.toISOString(),
            timestamp: new Date().toISOString()
        };

        this.ws.emitProductionUpdated({
            productionLogId: data.productionLogId,
            status: 'IN_PROGRESS',
            downtimeInfo: payload
        } as IProductionUpdatedPayload);

        console.log(`[Notification] Downtime ended on ${data.machineName} (${data.durationMinutes} min)`);
    }

    // ==================== STOCK ALERTS ====================

    notifyStockLow(data: IStockAlertData): void {
        const payload: IStockLowPayload = {
            stockItemId: data.stockItemId,
            stockCode: data.stockCode,
            materialTypeName: data.materialTypeName,
            currentQuantity: data.currentQuantity,
            minQuantity: data.minQuantity,
            alertLevel: 'WARNING'
        };

        this.ws.emitStockLow(payload);
        console.log(`[Notification] Stock low: ${data.stockCode} (${data.currentQuantity}/${data.minQuantity})`);
    }

    notifyStockCritical(data: IStockAlertData): void {
        const payload: IStockLowPayload = {
            stockItemId: data.stockItemId,
            stockCode: data.stockCode,
            materialTypeName: data.materialTypeName,
            currentQuantity: data.currentQuantity,
            minQuantity: data.minQuantity,
            alertLevel: 'CRITICAL'
        };

        this.ws.emitStockLow(payload);
        console.log(`[Notification] CRITICAL stock: ${data.stockCode} (${data.currentQuantity})`);
    }

    notifyStockReplenished(data: IStockAlertData): void {
        const payload: IStockUpdatedPayload = {
            stockItemId: data.stockItemId,
            stockCode: data.stockCode,
            newQuantity: data.currentQuantity,
            changeType: 'REPLENISHED'
        };

        this.ws.emitStockUpdated(payload);
        console.log(`[Notification] Stock replenished: ${data.stockCode}`);
    }

    // ==================== QUALITY ALERTS ====================

    notifyQualityIssue(data: IQualityAlertData): void {
        // Emit quality issue as production update
        const payload = {
            productionLogId: data.productionLogId,
            status: 'IN_PROGRESS',
            qualityAlert: {
                type: 'QUALITY_ISSUE',
                planNumber: data.planNumber,
                result: data.result,
                failedCount: data.failedCount,
                defectTypes: data.defectTypes,
                inspectorName: data.inspectorName,
                timestamp: data.timestamp.toISOString()
            }
        };

        this.ws.emitProductionUpdated(payload as IProductionUpdatedPayload);
        console.log(`[Notification] Quality issue on ${data.planNumber}: ${data.failedCount} failed`);
    }

    // ==================== SUBSCRIPTIONS ====================

    subscribeToProduction(userId: string, planIds: string[]): void {
        const existing = this.productionSubscriptions.get(userId) ?? new Set();
        planIds.forEach(id => existing.add(id));
        this.productionSubscriptions.set(userId, existing);
        console.log(`[Notification] User ${userId} subscribed to ${planIds.length} plans`);
    }

    unsubscribeFromProduction(userId: string): void {
        this.productionSubscriptions.delete(userId);
        console.log(`[Notification] User ${userId} unsubscribed from production updates`);
    }

    // ==================== UTILITY ====================

    getSubscribedPlanIds(userId: string): string[] {
        return Array.from(this.productionSubscriptions.get(userId) ?? []);
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if stock is below minimum threshold
 */
export function checkStockLevel(
    currentQuantity: number,
    minQuantity: number,
    alertThreshold = 0.2
): 'OK' | 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK' {
    if (currentQuantity <= 0) return 'OUT_OF_STOCK';
    if (currentQuantity <= minQuantity) return 'CRITICAL';
    if (currentQuantity <= minQuantity * (1 + alertThreshold)) return 'WARNING';
    return 'OK';
}

/**
 * Calculate production progress
 */
export function calculateProductionProgress(
    completedPieces: number,
    totalPieces: number
): number {
    if (totalPieces <= 0) return 0;
    return Math.min(100, Math.round((completedPieces / totalPieces) * 100));
}

/**
 * Estimate remaining time based on current progress
 */
export function estimateRemainingTime(
    startTime: Date,
    currentProgress: number
): number {
    if (currentProgress <= 0) return 0;

    const elapsed = (Date.now() - startTime.getTime()) / 60000; // minutes
    const estimatedTotal = elapsed / (currentProgress / 100);
    return Math.max(0, Math.round(estimatedTotal - elapsed));
}

// Singleton export
export const notificationManager = new NotificationManager(websocketService);
