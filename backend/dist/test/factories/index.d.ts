/**
 * Test Factory - Centralized Object Creation
 * Implements the Object Mother / Builder pattern for tests.
 * Allows easy creation of domain objects with valid defaults and flexible overrides.
 *
 * Migrated to use local type definitions instead of @prisma/client
 */
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
export declare const createMockUser: (overrides?: Partial<User>) => User;
export declare const createMockCuttingPlan: (overrides?: Partial<CuttingPlan>) => CuttingPlan;
export type MockPlanWithRelations = CuttingPlan & {
    scenario: {
        id: string;
        name: string;
    };
    stockUsed?: Array<{
        id: string;
        stockItemId: string;
        sequence: number;
        waste: number;
        wastePercentage: number;
    }>;
};
export declare const createMockPlanWithRelations: (overrides?: Partial<MockPlanWithRelations>) => MockPlanWithRelations;
export declare const createMockProductionLog: (overrides?: Partial<ProductionLog>) => ProductionLog;
export type { User, CuttingPlan, ProductionLog };
//# sourceMappingURL=index.d.ts.map