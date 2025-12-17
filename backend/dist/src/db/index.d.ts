/**
 * Drizzle ORM - Database Connection
 */
import { Pool } from 'pg';
import * as schema from './schema';
/**
 * Get or create database pool
 */
export declare function getPool(): Pool;
/**
 * Get Drizzle database instance
 */
export declare function getDb(): import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
/**
 * Database type for use in repositories
 */
export type Database = ReturnType<typeof getDb>;
/**
 * Close database pool
 */
export declare function closeDb(): Promise<void>;
/**
 * Check database connection health
 */
export declare function checkDbHealth(): Promise<boolean>;
export { schema };
export * from './schema';
//# sourceMappingURL=index.d.ts.map