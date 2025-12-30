"use strict";
/**
 * Status State Machine
 * Ensures valid state transitions for Optimization Scenarios and Plans
 * Following State Machine Pattern for data integrity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_TRANSITIONS = exports.SCENARIO_TRANSITIONS = exports.InvalidStatusTransitionError = exports.StatusMachine = void 0;
exports.createScenarioMachine = createScenarioMachine;
exports.createPlanMachine = createPlanMachine;
exports.isValidScenarioTransition = isValidScenarioTransition;
exports.isValidPlanTransition = isValidPlanTransition;
// ==================== STATE MACHINE ====================
class StatusMachine {
    transitions = new Map();
    currentStatus;
    constructor(initialStatus, allowedTransitions) {
        this.currentStatus = initialStatus;
        this.initializeTransitions(allowedTransitions);
    }
    initializeTransitions(transitions) {
        for (const transition of transitions) {
            const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from];
            for (const from of fromStates) {
                const existing = this.transitions.get(from) ?? new Set();
                existing.add(transition.to);
                this.transitions.set(from, existing);
            }
        }
    }
    /**
     * Check if transition to target status is allowed
     */
    canTransitionTo(status) {
        const allowed = this.transitions.get(this.currentStatus);
        return allowed?.has(status) ?? false;
    }
    /**
     * Get all valid next statuses
     */
    getValidTransitions() {
        const allowed = this.transitions.get(this.currentStatus);
        return allowed ? Array.from(allowed) : [];
    }
    /**
     * Attempt to transition to a new status
     * @throws Error if transition is not allowed
     */
    transitionTo(status) {
        if (!this.canTransitionTo(status)) {
            throw new InvalidStatusTransitionError(this.currentStatus, status, this.getValidTransitions());
        }
        this.currentStatus = status;
        return this.currentStatus;
    }
    /**
     * Try to transition, returns success boolean instead of throwing
     */
    tryTransitionTo(status) {
        if (!this.canTransitionTo(status)) {
            return false;
        }
        this.currentStatus = status;
        return true;
    }
    /**
     * Get current status
     */
    getStatus() {
        return this.currentStatus;
    }
    /**
     * Check if in terminal state (no outgoing transitions)
     */
    isTerminal() {
        return this.getValidTransitions().length === 0;
    }
}
exports.StatusMachine = StatusMachine;
// ==================== ERROR CLASS ====================
class InvalidStatusTransitionError extends Error {
    from;
    to;
    validTransitions;
    constructor(from, to, validTransitions) {
        const validStr = validTransitions.length > 0 ? validTransitions.join(', ') : 'none (terminal state)';
        super(`Invalid status transition: ${from} -> ${to}. ` + `Valid transitions from ${from}: ${validStr}`);
        this.name = 'InvalidStatusTransitionError';
        this.from = from;
        this.to = to;
        this.validTransitions = validTransitions;
    }
}
exports.InvalidStatusTransitionError = InvalidStatusTransitionError;
// ==================== SCENARIO STATUS MACHINE ====================
/**
 * Valid transitions for OptimizationScenario status
 *
 * PENDING -> RUNNING  (optimization started)
 * RUNNING -> COMPLETED (optimization finished successfully)
 * RUNNING -> FAILED   (optimization failed)
 * FAILED -> PENDING   (retry allowed)
 */
exports.SCENARIO_TRANSITIONS = [
    { from: 'PENDING', to: 'RUNNING', description: 'Start optimization' },
    { from: 'RUNNING', to: 'COMPLETED', description: 'Optimization completed' },
    { from: 'RUNNING', to: 'FAILED', description: 'Optimization failed' },
    { from: 'FAILED', to: 'PENDING', description: 'Retry optimization' }
];
function createScenarioMachine(initialStatus = 'PENDING') {
    return new StatusMachine(initialStatus, exports.SCENARIO_TRANSITIONS);
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
exports.PLAN_TRANSITIONS = [
    { from: 'DRAFT', to: 'APPROVED', description: 'Approve plan' },
    { from: 'DRAFT', to: 'CANCELLED', description: 'Reject plan' },
    { from: 'APPROVED', to: 'IN_PRODUCTION', description: 'Start production' },
    { from: 'APPROVED', to: 'CANCELLED', description: 'Retract approval' },
    { from: 'IN_PRODUCTION', to: 'COMPLETED', description: 'Complete production' },
    { from: 'IN_PRODUCTION', to: 'CANCELLED', description: 'Abort production' }
];
function createPlanMachine(initialStatus = 'DRAFT') {
    return new StatusMachine(initialStatus, exports.PLAN_TRANSITIONS);
}
// ==================== VALIDATION HELPERS ====================
/**
 * Validate a status transition without creating a full machine
 */
function isValidScenarioTransition(from, to) {
    const allowed = exports.SCENARIO_TRANSITIONS.filter((t) => {
        const fromStates = Array.isArray(t.from) ? t.from : [t.from];
        return fromStates.includes(from) && t.to === to;
    });
    return allowed.length > 0;
}
function isValidPlanTransition(from, to) {
    const allowed = exports.PLAN_TRANSITIONS.filter((t) => {
        const fromStates = Array.isArray(t.from) ? t.from : [t.from];
        return fromStates.includes(from) && t.to === to;
    });
    return allowed.length > 0;
}
//# sourceMappingURL=status-machine.js.map