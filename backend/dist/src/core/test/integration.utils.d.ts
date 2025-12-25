/**
 * Integration Test Utilities
 * Provides test database setup, cleanup, and helper functions
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
export interface ITestDatabase {
    pool: Pool;
    db: ReturnType<typeof drizzle>;
    cleanup: () => Promise<void>;
}
/**
 * Create a test database connection
 * Uses TEST_DATABASE_URL or creates isolated schema
 */
export declare function createTestDatabase(): Promise<ITestDatabase>;
/**
 * Truncate all tables in correct order (respects FK constraints)
 */
export declare function truncateAllTables(db: ReturnType<typeof drizzle>): Promise<void>;
export interface ITestTenant {
    id: string;
    name: string;
    code: string;
}
export interface ITestUser {
    id: string;
    email: string;
    tenantId: string;
}
/**
 * Create a test tenant
 */
export declare function createTestTenant(db: ReturnType<typeof drizzle>, data?: Partial<ITestTenant>): Promise<ITestTenant>;
/**
 * Wait for a condition to be true
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Expect a promise to reject with specific error
 */
export declare function expectToThrow(fn: () => Promise<unknown>, errorMatch?: string | RegExp): Promise<void>;
/**
 * Create a mock domain event
 */
export declare function createMockEvent(overrides?: Partial<{
    eventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
}>): {
    eventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    timestamp: Date;
    payload: Record<string, unknown>;
};
/**
 * Create a mock order
 */
export declare function createMockOrder(tenantId: string, customerId: string): {
    id: `${string}-${string}-${string}-${string}-${string}`;
    orderNumber: string;
    tenantId: string;
    customerId: string;
    status: "DRAFT";
};
//# sourceMappingURL=integration.utils.d.ts.map