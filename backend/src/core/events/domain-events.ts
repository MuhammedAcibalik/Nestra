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

import { createDomainEvent } from './event-bus';
import { IDomainEvent } from '../interfaces/event.interface';

// ==================== EVENT TYPES ====================

export const EventTypes = {
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
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// ==================== EVENT INTERFACES ====================

// Order Events
export interface OrderCreatedPayload {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    itemCount: number;
    createdById: string;
}

export interface OrderConfirmedPayload {
    orderId: string;
    orderNumber: string;
    itemCount: number;
    confirmedById: string;
}

export interface OrderStatusUpdateRequestedPayload {
    orderId: string;
    newStatus: string;
    requestedBy: string;
    correlationId: string;
}

export interface OrderStatusUpdatedPayload {
    orderId: string;
    oldStatus: string;
    newStatus: string;
    correlationId: string;
}

// CuttingJob Events
export interface CuttingJobCreatedPayload {
    jobId: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    itemCount: number;
}

export interface CuttingJobCompletedPayload {
    jobId: string;
    jobNumber: string;
    planCount: number;
}

// Optimization Events
export interface OptimizationStartedPayload {
    scenarioId: string;
    scenarioName: string;
    jobId: string;
    algorithm: string;
}

export interface OptimizationCompletedPayload {
    scenarioId: string;
    planId: string;
    planNumber: string;
    wastePercentage: number;
    efficiency: number;
}

export interface OptimizationFailedPayload {
    scenarioId: string;
    reason: string;
}

// Plan Events
export interface PlanApprovedPayload {
    planId: string;
    planNumber: string;
    approvedById: string;
    machineId?: string;
}

export interface PlanStatusUpdateRequestedPayload {
    planId: string;
    newStatus: string;
    requestedBy: string;
    correlationId: string;
}

export interface PlanStatusUpdatedPayload {
    planId: string;
    oldStatus: string;
    newStatus: string;
    correlationId: string;
}

// Production Events
export interface ProductionStartedPayload {
    logId: string;
    planId: string;
    planNumber: string;
    operatorId: string;
}

export interface ProductionCompletedPayload {
    logId: string;
    planId: string;
    actualWaste: number;
    actualTime: number;
}

// Stock Events - State Changes
export interface StockConsumedPayload {
    stockItemId: string;
    stockCode: string;
    quantity: number;
    productionLogId: string;
}

export interface StockLowAlertPayload {
    stockItemId: string;
    stockCode: string;
    currentQuantity: number;
    minThreshold: number;
}

// Stock Events - Commands
export interface StockConsumeRequestedPayload {
    stockItemId: string;
    quantity: number;
    reason: string;
    productionLogId?: string;
    correlationId: string;
}

export interface StockConsumeCompletedPayload {
    stockItemId: string;
    quantity: number;
    movementId: string;
    correlationId: string;
}

export interface StockConsumeFailedPayload {
    stockItemId: string;
    quantity: number;
    reason: string;
    correlationId: string;
}

export interface StockReserveRequestedPayload {
    stockItemId: string;
    quantity: number;
    planId: string;
    correlationId: string;
}

export interface StockReserveCompletedPayload {
    stockItemId: string;
    quantity: number;
    planId: string;
    correlationId: string;
}

// ==================== EVENT FACTORY FUNCTIONS ====================

export const DomainEvents = {
    // Order events
    orderCreated: (payload: OrderCreatedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.ORDER_CREATED, 'Order', payload.orderId, payload),

    orderConfirmed: (payload: OrderConfirmedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.ORDER_CONFIRMED, 'Order', payload.orderId, payload),

    orderStatusUpdateRequested: (payload: OrderStatusUpdateRequestedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.ORDER_STATUS_UPDATE_REQUESTED, 'Order', payload.orderId, payload),

    orderStatusUpdated: (payload: OrderStatusUpdatedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.ORDER_STATUS_UPDATED, 'Order', payload.orderId, payload),

    // CuttingJob events
    cuttingJobCreated: (payload: CuttingJobCreatedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.CUTTING_JOB_CREATED, 'CuttingJob', payload.jobId, payload),

    cuttingJobCompleted: (payload: CuttingJobCompletedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.CUTTING_JOB_COMPLETED, 'CuttingJob', payload.jobId, payload),

    // Optimization events
    optimizationStarted: (payload: OptimizationStartedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.OPTIMIZATION_STARTED, 'OptimizationScenario', payload.scenarioId, payload),

    optimizationCompleted: (payload: OptimizationCompletedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.OPTIMIZATION_COMPLETED, 'OptimizationScenario', payload.scenarioId, payload),

    optimizationFailed: (payload: OptimizationFailedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.OPTIMIZATION_FAILED, 'OptimizationScenario', payload.scenarioId, payload),

    // Plan events
    planApproved: (payload: PlanApprovedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.PLAN_APPROVED, 'CuttingPlan', payload.planId, payload),

    planStatusUpdateRequested: (payload: PlanStatusUpdateRequestedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.PLAN_STATUS_UPDATE_REQUESTED, 'CuttingPlan', payload.planId, payload),

    planStatusUpdated: (payload: PlanStatusUpdatedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.PLAN_STATUS_UPDATED, 'CuttingPlan', payload.planId, payload),

    // Production events
    productionStarted: (payload: ProductionStartedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.PRODUCTION_STARTED, 'ProductionLog', payload.logId, payload),

    productionCompleted: (payload: ProductionCompletedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.PRODUCTION_COMPLETED, 'ProductionLog', payload.logId, payload),

    // Stock events - State changes
    stockConsumed: (payload: StockConsumedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_CONSUMED, 'StockItem', payload.stockItemId, payload),

    stockLowAlert: (payload: StockLowAlertPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_LOW_ALERT, 'StockItem', payload.stockItemId, payload),

    // Stock events - Commands
    stockConsumeRequested: (payload: StockConsumeRequestedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_CONSUME_REQUESTED, 'StockItem', payload.stockItemId, payload),

    stockConsumeCompleted: (payload: StockConsumeCompletedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_CONSUME_COMPLETED, 'StockItem', payload.stockItemId, payload),

    stockConsumeFailed: (payload: StockConsumeFailedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_CONSUME_FAILED, 'StockItem', payload.stockItemId, payload),

    stockReserveRequested: (payload: StockReserveRequestedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_RESERVE_REQUESTED, 'StockItem', payload.stockItemId, payload),

    stockReserveCompleted: (payload: StockReserveCompletedPayload): IDomainEvent =>
        createDomainEvent(EventTypes.STOCK_RESERVE_COMPLETED, 'StockItem', payload.stockItemId, payload)
};

// ==================== CORRELATION ID HELPER ====================

export function generateCorrelationId(): string {
    return `cor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
