"use strict";
/**
 * Drizzle Database Mock Utilities
 * For use in unit tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockDatabase = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
// ==================== FACTORY ====================
/**
 * Create a mock database instance for testing.
 * Uses jest-mock-extended with proper type assertions.
 */
const createMockDatabase = () => {
    const mockDb = (0, jest_mock_extended_1.mock)();
    // Create mock query object with type assertion
    const createQueryMock = () => ({
        findFirst: jest.fn(),
        findMany: jest.fn()
    });
    // Setup query mocks for common tables
    // Using type assertion since mock doesn't have query property by default
    mockDb.query = {
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
    });
    mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
            onConflictDoNothing: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([])
            })
        })
    });
    mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([])
            })
        })
    });
    mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
    });
    return mockDb;
};
exports.createMockDatabase = createMockDatabase;
//# sourceMappingURL=db-mock.js.map