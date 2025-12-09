"use strict";
/**
 * WebSocket Event Types
 * Type-safe event definitions for real-time notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketEvents = void 0;
var WebSocketEvents;
(function (WebSocketEvents) {
    // Connection events
    WebSocketEvents["CONNECTION"] = "connection";
    WebSocketEvents["DISCONNECT"] = "disconnect";
    // Optimization events
    WebSocketEvents["OPTIMIZATION_STARTED"] = "optimization:started";
    WebSocketEvents["OPTIMIZATION_PROGRESS"] = "optimization:progress";
    WebSocketEvents["OPTIMIZATION_COMPLETED"] = "optimization:completed";
    WebSocketEvents["OPTIMIZATION_FAILED"] = "optimization:failed";
    // Production events
    WebSocketEvents["PRODUCTION_STARTED"] = "production:started";
    WebSocketEvents["PRODUCTION_UPDATED"] = "production:updated";
    WebSocketEvents["PRODUCTION_COMPLETED"] = "production:completed";
    // Stock events
    WebSocketEvents["STOCK_LOW"] = "stock:low";
    WebSocketEvents["STOCK_UPDATED"] = "stock:updated";
    // Job events
    WebSocketEvents["CUTTING_JOB_CREATED"] = "cutting-job:created";
    WebSocketEvents["CUTTING_JOB_STATUS_CHANGED"] = "cutting-job:status-changed";
})(WebSocketEvents || (exports.WebSocketEvents = WebSocketEvents = {}));
//# sourceMappingURL=events.js.map