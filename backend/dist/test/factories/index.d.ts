import { User, CuttingPlan, ProductionLog } from '@prisma/client';
/**
 * Test Factory - Centralized Object Creation
 * Implements the Object Mother / Builder pattern for tests.
 * Allows easy creation of domain objects with valid defaults and flexible overrides.
 */
export declare const createMockUser: (overrides?: Partial<User>) => User;
export declare const createMockCuttingPlan: (overrides?: Partial<CuttingPlan>) => CuttingPlan;
export type MockPlanWithRelations = CuttingPlan & {
    scenario: {
        id: string;
        name: string;
    };
    stockUsed?: any[];
};
export declare const createMockPlanWithRelations: (overrides?: Partial<MockPlanWithRelations>) => MockPlanWithRelations;
export declare const createMockProductionLog: (overrides?: Partial<ProductionLog>) => ProductionLog;
//# sourceMappingURL=index.d.ts.map