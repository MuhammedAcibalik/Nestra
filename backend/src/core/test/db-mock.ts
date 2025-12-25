/**
 * Drizzle Database Mock Utilities
 * For use in unit tests
 */

import { mock, MockProxy } from 'jest-mock-extended';
import { Database } from '../../db';

// ==================== FACTORY ====================

/**
 * Create a mock database instance for testing.
 * Uses jest-mock-extended with proper type assertions.
 */
export const createMockDatabase = (): MockProxy<Database> => {
    const mockDb = mock<Database>();

    // Create mock query object with type assertion
    const createQueryMock = () => ({
        findFirst: jest.fn(),
        findMany: jest.fn()
    });

    // Setup query mocks for common tables
    // Using type assertion since mock doesn't have query property by default
    (mockDb as unknown as { query: Record<string, ReturnType<typeof createQueryMock>> }).query = {
        users: createQueryMock(),
        roles: createQueryMock(),
        cuttingJobs: createQueryMock(),
        cuttingJobItems: createQueryMock(),
        orders: createQueryMock(),
        orderItems: createQueryMock(),
        materialTypes: createQueryMock(),
        thicknessRanges: createQueryMock(),
        stockItems: createQueryMock(),
        stockMovements: createQueryMock(),
        locations: createQueryMock(),
        machines: createQueryMock(),
        customers: createQueryMock(),
        optimizationScenarios: createQueryMock(),
        cuttingPlans: createQueryMock(),
        cuttingPlanStocks: createQueryMock(),
        productionLogs: createQueryMock(),
        tenants: createQueryMock(),
        activities: createQueryMock(),
        documentLocks: createQueryMock()
    };

    // Setup common Drizzle methods
    mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([])
                }),
                limit: jest.fn().mockResolvedValue([]),
                groupBy: jest.fn().mockResolvedValue([])
            }),
            orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([])
            }),
            limit: jest.fn().mockResolvedValue([]),
            leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    groupBy: jest.fn().mockResolvedValue([])
                })
            }),
            innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([])
            })
        })
    }) as MockProxy<Database>['select'];

    mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
            onConflictDoNothing: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([])
            })
        })
    }) as MockProxy<Database>['insert'];

    mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([])
            })
        })
    }) as MockProxy<Database>['update'];

    mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
    }) as MockProxy<Database>['delete'];

    return mockDb;
};

export type { MockProxy } from 'jest-mock-extended';
