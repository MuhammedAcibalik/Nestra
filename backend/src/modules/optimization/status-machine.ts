/**
 * Status State Machine
 * Ensures valid state transitions for Optimization Scenarios and Plans
 * Following State Machine Pattern for data integrity
 */

// ==================== STATUS TYPES ====================

export type ScenarioStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type PlanStatus = 'DRAFT' | 'APPROVED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';

// ==================== TRANSITION INTERFACE ====================

interface IStatusTransition<T extends string> {
    readonly from: T | readonly T[];
    readonly to: T;
    readonly description?: string;
}

// ==================== STATE MACHINE ====================

export class StatusMachine<T extends string> {
    private readonly transitions: Map<T, Set<T>> = new Map();
    private currentStatus: T;

    constructor(initialStatus: T, allowedTransitions: IStatusTransition<T>[]) {
        this.currentStatus = initialStatus;
        this.initializeTransitions(allowedTransitions);
    }

    private initializeTransitions(transitions: IStatusTransition<T>[]): void {
        for (const transition of transitions) {
            const fromStates = Array.isArray(transition.from)
                ? transition.from
                : [transition.from];

            for (const from of fromStates) {
                const existing = this.transitions.get(from) ?? new Set<T>();
                existing.add(transition.to);
                this.transitions.set(from, existing);
            }
        }
    }

    /**
     * Check if transition to target status is allowed
     */
    canTransitionTo(status: T): boolean {
        const allowed = this.transitions.get(this.currentStatus);
        return allowed?.has(status) ?? false;
    }

    /**
     * Get all valid next statuses
     */
    getValidTransitions(): T[] {
        const allowed = this.transitions.get(this.currentStatus);
        return allowed ? Array.from(allowed) : [];
    }

    /**
     * Attempt to transition to a new status
     * @throws Error if transition is not allowed
     */
    transitionTo(status: T): T {
        if (!this.canTransitionTo(status)) {
            throw new InvalidStatusTransitionError(
                this.currentStatus,
                status,
                this.getValidTransitions()
            );
        }
        this.currentStatus = status;
        return this.currentStatus;
    }

    /**
     * Try to transition, returns success boolean instead of throwing
     */
    tryTransitionTo(status: T): boolean {
        if (!this.canTransitionTo(status)) {
            return false;
        }
        this.currentStatus = status;
        return true;
    }

    /**
     * Get current status
     */
    getStatus(): T {
        return this.currentStatus;
    }

    /**
     * Check if in terminal state (no outgoing transitions)
     */
    isTerminal(): boolean {
        return this.getValidTransitions().length === 0;
    }
}

// ==================== ERROR CLASS ====================

export class InvalidStatusTransitionError extends Error {
    readonly from: string;
    readonly to: string;
    readonly validTransitions: string[];

    constructor(from: string, to: string, validTransitions: string[]) {
        const validStr = validTransitions.length > 0
            ? validTransitions.join(', ')
            : 'none (terminal state)';

        super(
            `Invalid status transition: ${from} -> ${to}. ` +
            `Valid transitions from ${from}: ${validStr}`
        );

        this.name = 'InvalidStatusTransitionError';
        this.from = from;
        this.to = to;
        this.validTransitions = validTransitions;
    }
}

// ==================== SCENARIO STATUS MACHINE ====================

/**
 * Valid transitions for OptimizationScenario status
 *
 * PENDING -> RUNNING  (optimization started)
 * RUNNING -> COMPLETED (optimization finished successfully)
 * RUNNING -> FAILED   (optimization failed)
 * FAILED -> PENDING   (retry allowed)
 */
export const SCENARIO_TRANSITIONS: IStatusTransition<ScenarioStatus>[] = [
    { from: 'PENDING', to: 'RUNNING', description: 'Start optimization' },
    { from: 'RUNNING', to: 'COMPLETED', description: 'Optimization completed' },
    { from: 'RUNNING', to: 'FAILED', description: 'Optimization failed' },
    { from: 'FAILED', to: 'PENDING', description: 'Retry optimization' }
];

export function createScenarioMachine(initialStatus: ScenarioStatus = 'PENDING'): StatusMachine<ScenarioStatus> {
    return new StatusMachine(initialStatus, SCENARIO_TRANSITIONS);
}

// ==================== PLAN STATUS MACHINE ====================

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
export const PLAN_TRANSITIONS: IStatusTransition<PlanStatus>[] = [
    { from: 'DRAFT', to: 'APPROVED', description: 'Approve plan' },
    { from: 'DRAFT', to: 'CANCELLED', description: 'Reject plan' },
    { from: 'APPROVED', to: 'IN_PRODUCTION', description: 'Start production' },
    { from: 'APPROVED', to: 'CANCELLED', description: 'Retract approval' },
    { from: 'IN_PRODUCTION', to: 'COMPLETED', description: 'Complete production' },
    { from: 'IN_PRODUCTION', to: 'CANCELLED', description: 'Abort production' }
];

export function createPlanMachine(initialStatus: PlanStatus = 'DRAFT'): StatusMachine<PlanStatus> {
    return new StatusMachine(initialStatus, PLAN_TRANSITIONS);
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validate a status transition without creating a full machine
 */
export function isValidScenarioTransition(from: ScenarioStatus, to: ScenarioStatus): boolean {
    const allowed = SCENARIO_TRANSITIONS.filter(t => {
        const fromStates = Array.isArray(t.from) ? t.from : [t.from];
        return fromStates.includes(from) && t.to === to;
    });
    return allowed.length > 0;
}

export function isValidPlanTransition(from: PlanStatus, to: PlanStatus): boolean {
    const allowed = PLAN_TRANSITIONS.filter(t => {
        const fromStates = Array.isArray(t.from) ? t.from : [t.from];
        return fromStates.includes(from) && t.to === to;
    });
    return allowed.length > 0;
}
