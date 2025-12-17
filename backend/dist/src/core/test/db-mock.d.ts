/**
 * Drizzle Database Mock Utilities
 * For use in unit tests - replaces prisma-mock.ts
 */
import { MockProxy } from 'jest-mock-extended';
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
export declare const createMockDatabase: () => MockProxy<Database>;
export type { MockProxy } from 'jest-mock-extended';
//# sourceMappingURL=db-mock.d.ts.map