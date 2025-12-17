/**
 * Status State Machine
 * Ensures valid state transitions for Optimization Scenarios and Plans
 * Following State Machine Pattern for data integrity
 */
export type ScenarioStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type PlanStatus = 'DRAFT' | 'APPROVED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';
interface IStatusTransition<T extends string> {
    readonly from: T | readonly T[];
    readonly to: T;
    readonly description?: string;
}
export declare class StatusMachine<T extends string> {
    private readonly transitions;
    private currentStatus;
    constructor(initialStatus: T, allowedTransitions: IStatusTransition<T>[]);
    private initializeTransitions;
    /**
     * Check if transition to target status is allowed
     */
    canTransitionTo(status: T): boolean;
    /**
     * Get all valid next statuses
     */
    getValidTransitions(): T[];
    /**
     * Attempt to transition to a new status
     * @throws Error if transition is not allowed
     */
    transitionTo(status: T): T;
    /**
     * Try to transition, returns success boolean instead of throwing
     */
    tryTransitionTo(status: T): boolean;
    /**
     * Get current status
     */
    getStatus(): T;
    /**
     * Check if in terminal state (no outgoing transitions)
     */
    isTerminal(): boolean;
}
export declare class InvalidStatusTransitionError extends Error {
    readonly from: string;
    readonly to: string;
    readonly validTransitions: string[];
    constructor(from: string, to: string, validTransitions: string[]);
}
/**
 * Valid transitions for OptimizationScenario status
 *
 * PENDING -> RUNNING  (optimization started)
 * RUNNING -> COMPLETED (optimization finished successfully)
 * RUNNING -> FAILED   (optimization failed)
 * FAILED -> PENDING   (retry allowed)
 */
export declare const SCENARIO_TRANSITIONS: IStatusTransition<ScenarioStatus>[];
export declare function createScenarioMachine(initialStatus?: ScenarioStatus): StatusMachine<ScenarioStatus>;
/**
 * Valid transitions for CuttingPlan status
 *
 * DRAFT -> APPROVED     (planner approves plan)
 * DRAFT -> CANCELLED    (plan rejected)
 * APPROVED -> IN_PRODUCTION (production started)
 * APPROVED -> CANCELLED    (approval retracted)
 * IN_PRODUCTION -> COMPLETED  (production finished)
 * IN_PRODUCTION -> CANCELLED  (production aborted)
 */
export declare const PLAN_TRANSITIONS: IStatusTransition<PlanStatus>[];
export declare function createPlanMachine(initialStatus?: PlanStatus): StatusMachine<PlanStatus>;
/**
 * Validate a status transition without creating a full machine
 */
export declare function isValidScenarioTransition(from: ScenarioStatus, to: ScenarioStatus): boolean;
export declare function isValidPlanTransition(from: PlanStatus, to: PlanStatus): boolean;
export {};
//# sourceMappingURL=status-machine.d.ts.map