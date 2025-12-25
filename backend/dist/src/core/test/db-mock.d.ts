/**
 * Drizzle Database Mock Utilities
 * For use in unit tests
 */
import { MockProxy } from 'jest-mock-extended';
import { Database } from '../../db';
/**
 * Create a mock database instance for testing.
 * Uses jest-mock-extended with proper type assertions.
 */
export declare const createMockDatabase: () => MockProxy<Database>;
export type { MockProxy } from 'jest-mock-extended';
//# sourceMappingURL=db-mock.d.ts.map