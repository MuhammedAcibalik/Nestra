/**
 * Test Factory - Centralized Object Creation
 * Implements the Object Mother / Builder pattern for tests.
 * Allows easy creation of domain objects with valid defaults and flexible overrides.
 * 
 * Migrated to use local type definitions instead of @prisma/client
 */

// Define types locally to avoid import issues
interface User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
    isActive: boolean;
    languageId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface CuttingPlan {
    id: string;
    planNumber: string;
    scenarioId: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime: number | null;
    estimatedCost: number | null;
    status: string;
    approvedById: string | null;
    approvedAt: Date | null;
    machineId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ProductionLog {
    id: string;
    cuttingPlanId: string;
    operatorId: string;
    status: string;
    actualTime: number | null;
    actualWaste: number | null;
    notes: string | null;
    issues: unknown | null;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export const createMockUser = (overrides: Partial<User> = {}): User => ({
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

export const createMockCuttingPlan = (overrides: Partial<CuttingPlan> = {}): CuttingPlan => ({
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

// Helper type for the complex PlanWithRelations structure often used in tests
export type MockPlanWithRelations = CuttingPlan & {
    scenario: { id: string; name: string };
    stockUsed?: Array<{
        id: string;
        stockItemId: string;
        sequence: number;
        waste: number;
        wastePercentage: number;
    }>;
};

export const createMockPlanWithRelations = (overrides: Partial<MockPlanWithRelations> = {}): MockPlanWithRelations => ({
    ...createMockCuttingPlan(),
    scenario: { id: 'sc-1', name: 'Scenario 1' },
    stockUsed: [],
    ...overrides
});

export const createMockProductionLog = (overrides: Partial<ProductionLog> = {}): ProductionLog => ({
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

// Export types
export type { User, CuttingPlan, ProductionLog };
