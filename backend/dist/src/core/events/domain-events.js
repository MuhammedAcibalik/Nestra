"use strict";
/**
 * Domain Events
 * All domain events for the Nestra system
 * Events enable loose coupling between modules
 *
 * PATTERN:
 * - State Change Events: MODULE.action (e.g., order.created)
 * - Command Events: MODULE.command-requested (e.g., stock.consume-requested)
 * - Response Events: MODULE.command-completed/failed (e.g., stock.consume-completed)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = exports.EventTypes = void 0;
exports.generateCorrelationId = generateCorrelationId;
const event_bus_1 = require("./event-bus");
// ==================== EVENT TYPES ====================
exports.EventTypes = {
    // Order events
    ORDER_CREATED: 'order.created',
    ORDER_CONFIRMED: 'order.confirmed',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_COMPLETED: 'order.completed',
    ORDER_STATUS_UPDATE_REQUESTED: 'order.status-update-requested',
    ORDER_STATUS_UPDATED: 'order.status-updated',
    // CuttingJob events
    CUTTING_JOB_CREATED: 'cutting-job.created',
    CUTTING_JOB_STARTED: 'cutting-job.started',
    CUTTING_JOB_COMPLETED: 'cutting-job.completed',
    // Optimization events
    OPTIMIZATION_STARTED: 'optimization.started',
    OPTIMIZATION_COMPLETED: 'optimization.completed',
    OPTIMIZATION_FAILED: 'optimization.failed',
    // CuttingPlan events
    PLAN_CREATED: 'plan.created',
    PLAN_APPROVED: 'plan.approved',
    PLAN_REJECTED: 'plan.rejected',
    PLAN_STATUS_UPDATE_REQUESTED: 'plan.status-update-requested',
    PLAN_STATUS_UPDATED: 'plan.status-updated',
    // Production events
    PRODUCTION_STARTED: 'production.started',
    PRODUCTION_PAUSED: 'production.paused',
    PRODUCTION_COMPLETED: 'production.completed',
    PRODUCTION_CANCELLED: 'production.cancelled',
    // Stock events - State changes
    STOCK_CREATED: 'stock.created',
    STOCK_UPDATED: 'stock.updated',
    STOCK_CONSUMED: 'stock.consumed',
    STOCK_LOW_ALERT: 'stock.low-alert',
    STOCK_MOVEMENT_CREATED: 'stock.movement-created',
    // Stock events - Commands (for cross-module async operations)
    STOCK_CONSUME_REQUESTED: 'stock.consume-requested',
    STOCK_CONSUME_COMPLETED: 'stock.consume-completed',
    STOCK_CONSUME_FAILED: 'stock.consume-failed',
    STOCK_RESERVE_REQUESTED: 'stock.reserve-requested',
    STOCK_RESERVE_COMPLETED: 'stock.reserve-completed',
    // Material events
    MATERIAL_CREATED: 'material.created',
    MATERIAL_UPDATED: 'material.updated',
    MATERIAL_DELETED: 'material.deleted',
    // Customer events
    CUSTOMER_CREATED: 'customer.created',
    CUSTOMER_UPDATED: 'customer.updated'
};
// ==================== EVENT FACTORY FUNCTIONS ====================
exports.DomainEvents = {
    // Order events
    orderCreated: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.ORDER_CREATED, 'Order', payload.orderId, payload),
    orderConfirmed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.ORDER_CONFIRMED, 'Order', payload.orderId, payload),
    orderStatusUpdateRequested: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.ORDER_STATUS_UPDATE_REQUESTED, 'Order', payload.orderId, payload),
    orderStatusUpdated: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.ORDER_STATUS_UPDATED, 'Order', payload.orderId, payload),
    // CuttingJob events
    cuttingJobCreated: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.CUTTING_JOB_CREATED, 'CuttingJob', payload.jobId, payload),
    cuttingJobCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.CUTTING_JOB_COMPLETED, 'CuttingJob', payload.jobId, payload),
    // Optimization events
    optimizationStarted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.OPTIMIZATION_STARTED, 'OptimizationScenario', payload.scenarioId, payload),
    optimizationCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.OPTIMIZATION_COMPLETED, 'OptimizationScenario', payload.scenarioId, payload),
    optimizationFailed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.OPTIMIZATION_FAILED, 'OptimizationScenario', payload.scenarioId, payload),
    // Plan events
    planApproved: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PLAN_APPROVED, 'CuttingPlan', payload.planId, payload),
    planStatusUpdateRequested: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PLAN_STATUS_UPDATE_REQUESTED, 'CuttingPlan', payload.planId, payload),
    planStatusUpdated: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PLAN_STATUS_UPDATED, 'CuttingPlan', payload.planId, payload),
    // Production events
    productionStarted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PRODUCTION_STARTED, 'ProductionLog', payload.logId, payload),
    productionCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PRODUCTION_COMPLETED, 'ProductionLog', payload.logId, payload),
    // Stock events - State changes
    stockConsumed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_CONSUMED, 'StockItem', payload.stockItemId, payload),
    stockLowAlert: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_LOW_ALERT, 'StockItem', payload.stockItemId, payload),
    // Stock events - Commands
    stockConsumeRequested: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_CONSUME_REQUESTED, 'StockItem', payload.stockItemId, payload),
    stockConsumeCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_CONSUME_COMPLETED, 'StockItem', payload.stockItemId, payload),
    stockConsumeFailed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_CONSUME_FAILED, 'StockItem', payload.stockItemId, payload),
    stockReserveRequested: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_RESERVE_REQUESTED, 'StockItem', payload.stockItemId, payload),
    stockReserveCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_RESERVE_COMPLETED, 'StockItem', payload.stockItemId, payload)
};
// ==================== CORRELATION ID HELPER ====================
function generateCorrelationId() {
    return `cor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
//# sourceMappingURL=domain-events.js.map