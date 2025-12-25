"use strict";
/**
 * Integration Test Utilities
 * Provides test database setup, cleanup, and helper functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestDatabase = createTestDatabase;
exports.truncateAllTables = truncateAllTables;
exports.createTestTenant = createTestTenant;
exports.waitFor = waitFor;
exports.expectToThrow = expectToThrow;
exports.createMockEvent = createMockEvent;
exports.createMockOrder = createMockOrder;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = __importStar(require("../../db/schema"));
/**
 * Create a test database connection
 * Uses TEST_DATABASE_URL or creates isolated schema
 */
async function createTestDatabase() {
    const connectionString = process.env.TEST_DATABASE_URL ??
        process.env.DATABASE_URL ??
        'postgresql://localhost:5432/nestra_test';
    const pool = new pg_1.Pool({ connectionString });
    const db = (0, node_postgres_1.drizzle)(pool, { schema });
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
];
/**
 * Truncate all tables in correct order (respects FK constraints)
 */
async function truncateAllTables(db) {
    // Disable FK checks temporarily for faster truncation
    await db.execute(/* sql */ `SET session_replication_role = 'replica'`);
    for (const table of tableOrder) {
        try {
            await db.execute(/* sql */ `TRUNCATE TABLE "${table}" CASCADE`);
        }
        catch {
            // Table might not exist, continue
        }
    }
    await db.execute(/* sql */ `SET session_replication_role = 'origin'`);
}
/**
 * Create a test tenant
 */
async function createTestTenant(db, data) {
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
async function waitFor(condition, timeout = 5000, interval = 100) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await condition())
            return;
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for condition');
}
/**
 * Expect a promise to reject with specific error
 */
async function expectToThrow(fn, errorMatch) {
    try {
        await fn();
        throw new Error('Expected function to throw');
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Expected function to throw') {
            throw error;
        }
        if (errorMatch && error instanceof Error) {
            const matches = typeof errorMatch === 'string'
                ? error.message.includes(errorMatch)
                : errorMatch.test(error.message);
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
function createMockEvent(overrides) {
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
function createMockOrder(tenantId, customerId) {
    return {
        id: crypto.randomUUID(),
        orderNumber: `ORD-${Date.now()}`,
        tenantId,
        customerId,
        status: 'DRAFT'
    };
}
//# sourceMappingURL=integration.utils.js.map