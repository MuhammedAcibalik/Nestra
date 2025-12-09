"use strict";
/**
 * Domain Events
 * All domain events for the Nestra system
 * Events enable loose coupling between modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = exports.EventTypes = void 0;
const event_bus_1 = require("./event-bus");
// ==================== EVENT TYPES ====================
exports.EventTypes = {
    // Order events
    ORDER_CREATED: 'order.created',
    ORDER_CONFIRMED: 'order.confirmed',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_COMPLETED: 'order.completed',
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
    // Production events
    PRODUCTION_STARTED: 'production.started',
    PRODUCTION_PAUSED: 'production.paused',
    PRODUCTION_COMPLETED: 'production.completed',
    PRODUCTION_CANCELLED: 'production.cancelled',
    // Stock events
    STOCK_CREATED: 'stock.created',
    STOCK_UPDATED: 'stock.updated',
    STOCK_CONSUMED: 'stock.consumed',
    STOCK_LOW_ALERT: 'stock.low-alert',
    STOCK_MOVEMENT_CREATED: 'stock.movement-created'
};
// ==================== EVENT FACTORY FUNCTIONS ====================
exports.DomainEvents = {
    // Order events
    orderCreated: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.ORDER_CREATED, 'Order', payload.orderId, payload),
    orderConfirmed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.ORDER_CONFIRMED, 'Order', payload.orderId, payload),
    // CuttingJob events
    cuttingJobCreated: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.CUTTING_JOB_CREATED, 'CuttingJob', payload.jobId, payload),
    cuttingJobCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.CUTTING_JOB_COMPLETED, 'CuttingJob', payload.jobId, payload),
    // Optimization events
    optimizationStarted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.OPTIMIZATION_STARTED, 'OptimizationScenario', payload.scenarioId, payload),
    optimizationCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.OPTIMIZATION_COMPLETED, 'OptimizationScenario', payload.scenarioId, payload),
    optimizationFailed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.OPTIMIZATION_FAILED, 'OptimizationScenario', payload.scenarioId, payload),
    // Plan events
    planApproved: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PLAN_APPROVED, 'CuttingPlan', payload.planId, payload),
    // Production events
    productionStarted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PRODUCTION_STARTED, 'ProductionLog', payload.logId, payload),
    productionCompleted: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.PRODUCTION_COMPLETED, 'ProductionLog', payload.logId, payload),
    // Stock events
    stockConsumed: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_CONSUMED, 'StockItem', payload.stockItemId, payload),
    stockLowAlert: (payload) => (0, event_bus_1.createDomainEvent)(exports.EventTypes.STOCK_LOW_ALERT, 'StockItem', payload.stockItemId, payload)
};
//# sourceMappingURL=domain-events.js.map