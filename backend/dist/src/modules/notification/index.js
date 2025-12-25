"use strict";
/**
 * Notification Module
 * Multi-channel notification system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = exports.initializeNotificationService = exports.getNotificationService = exports.NotificationService = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./channels"), exports);
var notification_service_1 = require("./notification.service");
Object.defineProperty(exports, "NotificationService", { enumerable: true, get: function () { return notification_service_1.NotificationService; } });
Object.defineProperty(exports, "getNotificationService", { enumerable: true, get: function () { return notification_service_1.getNotificationService; } });
Object.defineProperty(exports, "initializeNotificationService", { enumerable: true, get: function () { return notification_service_1.initializeNotificationService; } });
Object.defineProperty(exports, "notify", { enumerable: true, get: function () { return notification_service_1.notify; } });
//# sourceMappingURL=index.js.map