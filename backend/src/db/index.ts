/**
 * Drizzle ORM - Database Connection
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('Database');

// Database connection pool
let pool: Pool | null = null;

/**
 * Get or create database pool
 */
export function getPool(): Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('[DB] DATABASE_URL environment variable is not set');
        }

        pool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        pool.on('error', (err) => {
            logger.error('Unexpected error on idle client', { error: err });
        });
    }
    return pool;
}

/**
 * Get Drizzle database instance
 */
export function getDb() {
    return drizzle(getPool(), { schema });
}

/**
 * Database type for use in repositories
 */
export type Database = ReturnType<typeof getDb>;

/**
 * Close database pool
 */
export async function closeDb(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('Connection pool closed');
    }
}

/**
 * Check database connection health
 */
export async function checkDbHealth(): Promise<boolean> {
    try {
        const client = await getPool().connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    } catch {
        return false;
    }
}

// Export schema for use in queries
export { schema };
export * from './schema';
