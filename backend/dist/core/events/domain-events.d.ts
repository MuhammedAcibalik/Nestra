/**
 * Domain Events
 * All domain events for the Nestra system
 * Events enable loose coupling between modules
 */
import { IDomainEvent } from '../interfaces/event.interface';
export declare const EventTypes: {
    readonly ORDER_CREATED: "order.created";
    readonly ORDER_CONFIRMED: "order.confirmed";
    readonly ORDER_CANCELLED: "order.cancelled";
    readonly ORDER_COMPLETED: "order.completed";
    readonly CUTTING_JOB_CREATED: "cutting-job.created";
    readonly CUTTING_JOB_STARTED: "cutting-job.started";
    readonly CUTTING_JOB_COMPLETED: "cutting-job.completed";
    readonly OPTIMIZATION_STARTED: "optimization.started";
    readonly OPTIMIZATION_COMPLETED: "optimization.completed";
    readonly OPTIMIZATION_FAILED: "optimization.failed";
    readonly PLAN_CREATED: "plan.created";
    readonly PLAN_APPROVED: "plan.approved";
    readonly PLAN_REJECTED: "plan.rejected";
    readonly PRODUCTION_STARTED: "production.started";
    readonly PRODUCTION_PAUSED: "production.paused";
    readonly PRODUCTION_COMPLETED: "production.completed";
    readonly PRODUCTION_CANCELLED: "production.cancelled";
    readonly STOCK_CREATED: "stock.created";
    readonly STOCK_UPDATED: "stock.updated";
    readonly STOCK_CONSUMED: "stock.consumed";
    readonly STOCK_LOW_ALERT: "stock.low-alert";
    readonly STOCK_MOVEMENT_CREATED: "stock.movement-created";
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
export declare const DomainEvents: {
    orderCreated: (payload: OrderCreatedPayload) => IDomainEvent;
    orderConfirmed: (payload: OrderConfirmedPayload) => IDomainEvent;
    cuttingJobCreated: (payload: CuttingJobCreatedPayload) => IDomainEvent;
    cuttingJobCompleted: (payload: CuttingJobCompletedPayload) => IDomainEvent;
    optimizationStarted: (payload: OptimizationStartedPayload) => IDomainEvent;
    optimizationCompleted: (payload: OptimizationCompletedPayload) => IDomainEvent;
    optimizationFailed: (payload: OptimizationFailedPayload) => IDomainEvent;
    planApproved: (payload: PlanApprovedPayload) => IDomainEvent;
    productionStarted: (payload: ProductionStartedPayload) => IDomainEvent;
    productionCompleted: (payload: ProductionCompletedPayload) => IDomainEvent;
    stockConsumed: (payload: StockConsumedPayload) => IDomainEvent;
    stockLowAlert: (payload: StockLowAlertPayload) => IDomainEvent;
};
//# sourceMappingURL=domain-events.d.ts.map