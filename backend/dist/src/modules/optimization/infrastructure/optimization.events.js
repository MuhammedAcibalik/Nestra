"use strict";
/**
 * Optimization Events
 * WebSocket event emitters for optimization process
 * Following SRP - Only handles event emission
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizationEventEmitter = exports.OptimizationEventEmitter = void 0;
const websocket_1 = require("../../../websocket");
class OptimizationEventEmitter {
    emitStarted(scenarioId, scenarioName, cuttingJobId) {
        websocket_1.websocketService.emitOptimizationStarted({
            scenarioId,
            scenarioName,
            cuttingJobId,
            startedAt: new Date()
        });
    }
    emitProgress(scenarioId, progress, message) {
        websocket_1.websocketService.emitOptimizationProgress({
            scenarioId,
            progress,
            message
        });
    }
    emitCompleted(scenarioId, planId, planNumber, totalWaste, wastePercentage, stockUsedCount) {
        websocket_1.websocketService.emitOptimizationCompleted({
            scenarioId,
            planId,
            planNumber,
            totalWaste,
            wastePercentage,
            stockUsedCount,
            completedAt: new Date()
        });
    }
    emitFailed(scenarioId, error) {
        websocket_1.websocketService.emitOptimizationFailed({
            scenarioId,
            error,
            failedAt: new Date()
        });
    }
}
exports.OptimizationEventEmitter = OptimizationEventEmitter;
exports.optimizationEventEmitter = new OptimizationEventEmitter();
//# sourceMappingURL=optimization.events.js.map