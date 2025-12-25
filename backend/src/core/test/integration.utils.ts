/**
 * Integration Test Utilities
 * Provides test database setup, cleanup, and helper functions
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../db/schema';

// ==================== TEST DATABASE ====================

export interface ITestDatabase {
    pool: Pool;
    db: ReturnType<typeof drizzle>;
    cleanup: () => Promise<void>;
}

/**
 * Create a test database connection
 * Uses TEST_DATABASE_URL or creates isolated schema
 */
export async function createTestDatabase(): Promise<ITestDatabase> {
    const connectionString =
        process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgresql://localhost:5432/nestra_test';

    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    // Cleanup function
    const cleanup = async () => {
        await pool.end();
    };

    return { pool, db, cleanup };
}

// ==================== TABLE TRUNCATION ====================

const tableOrder = [
    'domain_events',
    'audit_logs',
    'production_logs',
    'cutting_plans',
    'optimization_scenarios',
    'cutting_jobs',
    'order_items',
    'orders',
    'stock_items',
    'materials',
    'customers',
    'users',
    'tenants'
] as const;

/**
 * Truncate all tables in correct order (respects FK constraints)
 */
export async function truncateAllTables(db: ReturnType<typeof drizzle>): Promise<void> {
    // Disable FK checks temporarily for faster truncation
    await db.execute(/* sql */ `SET session_replication_role = 'replica'`);

    for (const table of tableOrder) {
        try {
            await db.execute(/* sql */ `TRUNCATE TABLE "${table}" CASCADE`);
        } catch {
            // Table might not exist, continue
        }
    }

    await db.execute(/* sql */ `SET session_replication_role = 'origin'`);
}

// ==================== SEED HELPERS ====================

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
export async function createTestTenant(
    db: ReturnType<typeof drizzle>,
    data?: Partial<ITestTenant>
): Promise<ITestTenant> {
    const code = data?.code ?? `TEST${Date.now()}`;
    const tenant = {
        id: data?.id ?? crypto.randomUUID(),
        name: data?.name ?? 'Test Tenant',
        code
    };

    await db.insert(schema.tenants).values({
        name: tenant.name,
        slug: code.toLowerCase(),
        isActive: true
    });

    return tenant;
}

// ==================== ASSERTION HELPERS ====================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await condition()) return;
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for condition');
}

/**
 * Expect a promise to reject with specific error
 */
export async function expectToThrow(fn: () => Promise<unknown>, errorMatch?: string | RegExp): Promise<void> {
    try {
        await fn();
        throw new Error('Expected function to throw');
    } catch (error) {
        if (error instanceof Error && error.message === 'Expected function to throw') {
            throw error;
        }
        if (errorMatch && error instanceof Error) {
            const matches =
                typeof errorMatch === 'string' ? error.message.includes(errorMatch) : errorMatch.test(error.message);
            if (!matches) {
                throw new Error(`Expected error to match ${errorMatch}, got: ${error.message}`);
            }
        }
    }
}

// ==================== MOCK FACTORIES ====================

/**
 * Create a mock domain event
 */
export function createMockEvent(
    overrides?: Partial<{
        eventId: string;
        eventType: string;
        aggregateType: string;
        aggregateId: string;
        payload: Record<string, unknown>;
    }>
) {
    return {
        eventId: overrides?.eventId ?? crypto.randomUUID(),
        eventType: overrides?.eventType ?? 'test.event',
        aggregateType: overrides?.aggregateType ?? 'TestAggregate',
        aggregateId: overrides?.aggregateId ?? crypto.randomUUID(),
        timestamp: new Date(),
        payload: overrides?.payload ?? { test: true }
    };
}

/**
 * Create a mock order
 */
export function createMockOrder(tenantId: string, customerId: string) {
    return {
        id: crypto.randomUUID(),
        orderNumber: `ORD-${Date.now()}`,
        tenantId,
        customerId,
        status: 'DRAFT' as const
    };
}
