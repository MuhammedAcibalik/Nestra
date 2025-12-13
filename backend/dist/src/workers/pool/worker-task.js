"use strict";
/**
 * Worker Task Interfaces
 * Type definitions for worker communication
 * Following ISP - Separate interfaces for different task types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.is1DPayload = is1DPayload;
exports.is2DPayload = is2DPayload;
exports.createTask = createTask;
exports.createResult = createResult;
// ==================== TYPE GUARDS ====================
function is1DPayload(payload) {
    return 'stockBars' in payload;
}
function is2DPayload(payload) {
    return 'stockSheets' in payload;
}
// ==================== HELPER FUNCTIONS ====================
function createTask(type, payload) {
    return {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type,
        payload,
        timestamp: Date.now()
    };
}
function createResult(taskId, success, result, error, startTime) {
    return {
        id: taskId,
        success,
        result,
        error,
        executionTime: startTime ? Date.now() - startTime : 0
    };
}
//# sourceMappingURL=worker-task.js.map