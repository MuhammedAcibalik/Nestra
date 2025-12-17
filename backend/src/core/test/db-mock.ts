/**
 * Drizzle Database Mock Utilities
 * For use in unit tests - replaces prisma-mock.ts
 */

import { mock, MockProxy } from 'jest-mock-extended';
import { Database } from '../../db';

export interface MockDatabaseContext {
    db: MockProxy<Database>;
    query: {
        [key: string]: {
            findFirst: jest.Mock;
            findMany: jest.Mock;
        };
    };
}

export const createMockDatabase = (): MockProxy<Database> => {
    const mockDb = mock<Database>();

    // Create mock query object
    const createQueryMock = () => ({
        findFirst: jest.fn(),
        findMany: jest.fn()
    });

    // Setup query mocks for common tables
    (mockDb as any).query = {
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
        productionLogs: createQueryMock()
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
    }) as any;

    mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
            onConflictDoNothing: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([])
            })
        })
    }) as any;

    mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([])
            })
        })
    }) as any;

    mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
    }) as any;

    return mockDb;
};

export type { MockProxy } from 'jest-mock-extended';
