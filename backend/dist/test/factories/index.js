"use strict";
/**
 * Test Factory - Centralized Object Creation
 * Implements the Object Mother / Builder pattern for tests.
 * Allows easy creation of domain objects with valid defaults and flexible overrides.
 *
 * Migrated to use local type definitions instead of @prisma/client
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockProductionLog = exports.createMockPlanWithRelations = exports.createMockCuttingPlan = exports.createMockUser = void 0;
const createMockUser = (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    roleId: 'role-1',
    isActive: true,
    languageId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
exports.createMockUser = createMockUser;
const createMockCuttingPlan = (overrides = {}) => ({
    id: 'plan-1',
    planNumber: 'PN-001',
    scenarioId: 'sc-1',
    totalWaste: 10,
    wastePercentage: 5,
    stockUsedCount: 2,
    estimatedTime: 120,
    estimatedCost: 100,
    status: 'APPROVED',
    approvedById: null,
    approvedAt: null,
    machineId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
exports.createMockCuttingPlan = createMockCuttingPlan;
const createMockPlanWithRelations = (overrides = {}) => ({
    ...(0, exports.createMockCuttingPlan)(),
    scenario: { id: 'sc-1', name: 'Scenario 1' },
    stockUsed: [],
    ...overrides
});
exports.createMockPlanWithRelations = createMockPlanWithRelations;
const createMockProductionLog = (overrides = {}) => ({
    id: 'log-1',
    cuttingPlanId: 'plan-1',
    operatorId: 'op-1',
    status: 'STARTED',
    actualTime: null,
    actualWaste: null,
    notes: null,
    issues: null,
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
exports.createMockProductionLog = createMockProductionLog;
//# sourceMappingURL=index.js.map