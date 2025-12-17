"use strict";
/**
 * Notification Manager
 * Centralized service for managing live production tracking and stock alerts
 * Following SOLID principles with proper event handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationManager = void 0;
exports.checkStockLevel = checkStockLevel;
exports.calculateProductionProgress = calculateProductionProgress;
exports.estimateRemainingTime = estimateRemainingTime;
const websocket_service_1 = require("./websocket.service");
class NotificationManager {
    ws;
    productionSubscriptions = new Map(); // userId -> planIds
    constructor(wsService) {
        this.ws = wsService;
    }
    // ==================== PRODUCTION TRACKING ====================
    notifyProductionStarted(data) {
        const payload = {
            productionLogId: data.productionLogId,
            planNumber: data.planNumber,
            operatorName: data.operatorName,
            startedAt: data.timestamp.toISOString()
        };
        this.ws.emitProductionStarted(payload);
        console.log(`[Notification] Production started: ${data.planNumber}`);
    }
    notifyProductionProgress(data) {
        const payload = {
            productionLogId: data.productionLogId,
            status: data.status,
            progress: data.progress,
            currentPiece: data.currentPiece,
            totalPieces: data.totalPieces,
            estimatedTimeRemaining: data.estimatedTimeRemaining
        };
        this.ws.emitProductionUpdated(payload);
    }
    notifyProductionCompleted(data) {
        const payload = {
            productionLogId: data.productionLogId,
            planNumber: data.planNumber,
            actualWaste: data.actualWaste ?? 0,
            completedAt: data.timestamp.toISOString()
        };
        this.ws.emitProductionCompleted(payload);
        console.log(`[Notification] Production completed: ${data.planNumber}`);
    }
    notifyProductionPaused(data) {
        const payload = {
            productionLogId: data.productionLogId,
            status: 'PAUSED',
            progress: data.progress
        };
        this.ws.emitProductionUpdated(payload);
        console.log(`[Notification] Production paused: ${data.planNumber}`);
    }
    // ==================== DOWNTIME ALERTS ====================
    notifyDowntimeStarted(data) {
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
        });
        console.log(`[Notification] Downtime started on ${data.machineName}: ${data.reason}`);
    }
    notifyDowntimeEnded(data) {
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
        });
        console.log(`[Notification] Downtime ended on ${data.machineName} (${data.durationMinutes} min)`);
    }
    // ==================== STOCK ALERTS ====================
    notifyStockLow(data) {
        const payload = {
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
    notifyStockCritical(data) {
        const payload = {
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
    notifyStockReplenished(data) {
        const payload = {
            stockItemId: data.stockItemId,
            stockCode: data.stockCode,
            newQuantity: data.currentQuantity,
            changeType: 'REPLENISHED'
        };
        this.ws.emitStockUpdated(payload);
        console.log(`[Notification] Stock replenished: ${data.stockCode}`);
    }
    // ==================== QUALITY ALERTS ====================
    notifyQualityIssue(data) {
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
        this.ws.emitProductionUpdated(payload);
        console.log(`[Notification] Quality issue on ${data.planNumber}: ${data.failedCount} failed`);
    }
    // ==================== SUBSCRIPTIONS ====================
    subscribeToProduction(userId, planIds) {
        const existing = this.productionSubscriptions.get(userId) ?? new Set();
        planIds.forEach(id => existing.add(id));
        this.productionSubscriptions.set(userId, existing);
        console.log(`[Notification] User ${userId} subscribed to ${planIds.length} plans`);
    }
    unsubscribeFromProduction(userId) {
        this.productionSubscriptions.delete(userId);
        console.log(`[Notification] User ${userId} unsubscribed from production updates`);
    }
    // ==================== UTILITY ====================
    getSubscribedPlanIds(userId) {
        return Array.from(this.productionSubscriptions.get(userId) ?? []);
    }
}
// ==================== HELPER FUNCTIONS ====================
/**
 * Check if stock is below minimum threshold
 */
function checkStockLevel(currentQuantity, minQuantity, alertThreshold = 0.2) {
    if (currentQuantity <= 0)
        return 'OUT_OF_STOCK';
    if (currentQuantity <= minQuantity)
        return 'CRITICAL';
    if (currentQuantity <= minQuantity * (1 + alertThreshold))
        return 'WARNING';
    return 'OK';
}
/**
 * Calculate production progress
 */
function calculateProductionProgress(completedPieces, totalPieces) {
    if (totalPieces <= 0)
        return 0;
    return Math.min(100, Math.round((completedPieces / totalPieces) * 100));
}
/**
 * Estimate remaining time based on current progress
 */
function estimateRemainingTime(startTime, currentProgress) {
    if (currentProgress <= 0)
        return 0;
    const elapsed = (Date.now() - startTime.getTime()) / 60000; // minutes
    const estimatedTotal = elapsed / (currentProgress / 100);
    return Math.max(0, Math.round(estimatedTotal - elapsed));
}
// Singleton export
exports.notificationManager = new NotificationManager(websocket_service_1.websocketService);
//# sourceMappingURL=notification-manager.js.map