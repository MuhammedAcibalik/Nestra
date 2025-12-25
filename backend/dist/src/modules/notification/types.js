"use strict";
/**
 * Notification System Types
 * Multi-channel notification support: Email, SMS, Push, In-App
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultNotificationConfig = exports.defaultNotificationPreferences = exports.NotificationEvents = void 0;
// ==================== NOTIFICATION EVENTS ====================
exports.NotificationEvents = {
    // Stock
    STOCK_LOW: 'stock_low',
    STOCK_CRITICAL: 'stock_critical',
    STOCK_OUT: 'stock_out',
    // Orders
    ORDER_CREATED: 'order_created',
    ORDER_STATUS_CHANGED: 'order_status_changed',
    ORDER_COMPLETED: 'order_completed',
    // Production
    PRODUCTION_STARTED: 'production_started',
    PRODUCTION_COMPLETED: 'production_completed',
    PRODUCTION_ISSUE: 'production_issue',
    // Optimization
    OPTIMIZATION_READY: 'optimization_ready',
    OPTIMIZATION_FAILED: 'optimization_failed',
    // System
    SYSTEM_MAINTENANCE: 'system_maintenance',
    SYSTEM_ALERT: 'system_alert',
    // Collaboration
    MENTION: 'mention',
    DOCUMENT_SHARED: 'document_shared',
    COMMENT_ADDED: 'comment_added'
};
exports.defaultNotificationPreferences = {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    events: {
        [exports.NotificationEvents.STOCK_CRITICAL]: ['email', 'push', 'in_app'],
        [exports.NotificationEvents.STOCK_LOW]: ['in_app'],
        [exports.NotificationEvents.STOCK_OUT]: ['email', 'push', 'in_app'],
        [exports.NotificationEvents.ORDER_CREATED]: ['in_app'],
        [exports.NotificationEvents.ORDER_STATUS_CHANGED]: ['in_app'],
        [exports.NotificationEvents.ORDER_COMPLETED]: ['in_app'],
        [exports.NotificationEvents.PRODUCTION_STARTED]: ['in_app'],
        [exports.NotificationEvents.PRODUCTION_COMPLETED]: ['push', 'in_app'],
        [exports.NotificationEvents.PRODUCTION_ISSUE]: ['email', 'push', 'in_app'],
        [exports.NotificationEvents.OPTIMIZATION_READY]: ['push', 'in_app'],
        [exports.NotificationEvents.OPTIMIZATION_FAILED]: ['email', 'in_app'],
        [exports.NotificationEvents.SYSTEM_MAINTENANCE]: ['email', 'push'],
        [exports.NotificationEvents.SYSTEM_ALERT]: ['email', 'push', 'in_app'],
        [exports.NotificationEvents.MENTION]: ['push', 'in_app'],
        [exports.NotificationEvents.DOCUMENT_SHARED]: ['in_app'],
        [exports.NotificationEvents.COMMENT_ADDED]: ['in_app']
    }
};
exports.defaultNotificationConfig = {
    enabled: true,
    defaultChannel: 'in_app'
};
//# sourceMappingURL=types.js.map