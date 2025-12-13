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
import { IDomainEvent } from '../interfaces/event.interface';
export declare const EventTypes: {
    readonly ORDER_CREATED: "order.created";
    readonly ORDER_CONFIRMED: "order.confirmed";
    readonly ORDER_CANCELLED: "order.cancelled";
    readonly ORDER_COMPLETED: "order.completed";
    readonly ORDER_STATUS_UPDATE_REQUESTED: "order.status-update-requested";
    readonly ORDER_STATUS_UPDATED: "order.status-updated";
    readonly CUTTING_JOB_CREATED: "cutting-job.created";
    readonly CUTTING_JOB_STARTED: "cutting-job.started";
    readonly CUTTING_JOB_COMPLETED: "cutting-job.completed";
    readonly OPTIMIZATION_RUN_REQUESTED: "optimization.run-requested";
    readonly OPTIMIZATION_STARTED: "optimization.started";
    readonly OPTIMIZATION_COMPLETED: "optimization.completed";
    readonly OPTIMIZATION_FAILED: "optimization.failed";
    readonly PLAN_CREATED: "plan.created";
    readonly PLAN_APPROVED: "plan.approved";
    readonly PLAN_REJECTED: "plan.rejected";
    readonly PLAN_STATUS_UPDATE_REQUESTED: "plan.status-update-requested";
    readonly PLAN_STATUS_UPDATED: "plan.status-updated";
    readonly PRODUCTION_STARTED: "production.started";
    readonly PRODUCTION_PAUSED: "production.paused";
    readonly PRODUCTION_COMPLETED: "production.completed";
    readonly PRODUCTION_CANCELLED: "production.cancelled";
    readonly STOCK_CREATED: "stock.created";
    readonly STOCK_UPDATED: "stock.updated";
    readonly STOCK_CONSUMED: "stock.consumed";
    readonly STOCK_LOW_ALERT: "stock.low-alert";
    readonly STOCK_MOVEMENT_CREATED: "stock.movement-created";
    readonly STOCK_CONSUME_REQUESTED: "stock.consume-requested";
    readonly STOCK_CONSUME_COMPLETED: "stock.consume-completed";
    readonly STOCK_CONSUME_FAILED: "stock.consume-failed";
    readonly STOCK_RESERVE_REQUESTED: "stock.reserve-requested";
    readonly STOCK_RESERVE_COMPLETED: "stock.reserve-completed";
    readonly MATERIAL_CREATED: "material.created";
    readonly MATERIAL_UPDATED: "material.updated";
    readonly MATERIAL_DELETED: "material.deleted";
    readonly CUSTOMER_CREATED: "customer.created";
    readonly CUSTOMER_UPDATED: "customer.updated";
};
export type EventType = typeof EventTypes[keyof typeof EventTypes];
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
export declare const DomainEvents: {
    orderCreated: (payload: OrderCreatedPayload) => IDomainEvent;
    orderConfirmed: (payload: OrderConfirmedPayload) => IDomainEvent;
    orderStatusUpdateRequested: (payload: OrderStatusUpdateRequestedPayload) => IDomainEvent;
    orderStatusUpdated: (payload: OrderStatusUpdatedPayload) => IDomainEvent;
    cuttingJobCreated: (payload: CuttingJobCreatedPayload) => IDomainEvent;
    cuttingJobCompleted: (payload: CuttingJobCompletedPayload) => IDomainEvent;
    optimizationStarted: (payload: OptimizationStartedPayload) => IDomainEvent;
    optimizationCompleted: (payload: OptimizationCompletedPayload) => IDomainEvent;
    optimizationFailed: (payload: OptimizationFailedPayload) => IDomainEvent;
    planApproved: (payload: PlanApprovedPayload) => IDomainEvent;
    planStatusUpdateRequested: (payload: PlanStatusUpdateRequestedPayload) => IDomainEvent;
    planStatusUpdated: (payload: PlanStatusUpdatedPayload) => IDomainEvent;
    productionStarted: (payload: ProductionStartedPayload) => IDomainEvent;
    productionCompleted: (payload: ProductionCompletedPayload) => IDomainEvent;
    stockConsumed: (payload: StockConsumedPayload) => IDomainEvent;
    stockLowAlert: (payload: StockLowAlertPayload) => IDomainEvent;
    stockConsumeRequested: (payload: StockConsumeRequestedPayload) => IDomainEvent;
    stockConsumeCompleted: (payload: StockConsumeCompletedPayload) => IDomainEvent;
    stockConsumeFailed: (payload: StockConsumeFailedPayload) => IDomainEvent;
    stockReserveRequested: (payload: StockReserveRequestedPayload) => IDomainEvent;
    stockReserveCompleted: (payload: StockReserveCompletedPayload) => IDomainEvent;
};
export declare function generateCorrelationId(): string;
//# sourceMappingURL=domain-events.d.ts.map