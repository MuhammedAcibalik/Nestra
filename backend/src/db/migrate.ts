/**
 * Database Migration Runner
 * Executes SQL migrations in order with tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('MigrationRunner');

// ==================== TYPES ====================

interface IMigrationFile {
    name: string;
    path: string;
    content: string;
}

// ==================== DATABASE ====================

function createPool(): Pool {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    return new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });
}

// ==================== MIGRATION FUNCTIONS ====================

/**
 * Ensure migrations tracking table exists
 */
async function ensureMigrationTable(pool: Pool): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(pool: Pool): Promise<string[]> {
    const result = await pool.query(`
        SELECT name FROM _migrations ORDER BY applied_at
    `);
    return result.rows.map(r => r.name);
}

/**
 * Mark migration as applied
 */
async function markMigrationApplied(pool: Pool, name: string): Promise<void> {
    await pool.query(`
        INSERT INTO _migrations (name) VALUES ($1)
    `, [name]);
}

/**
 * Get all migration files from migrations directory
 */
function getMigrationFiles(migrationsDir: string): IMigrationFile[] {
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    return files.map(name => ({
        name,
        path: path.join(migrationsDir, name),
        content: fs.readFileSync(path.join(migrationsDir, name), 'utf-8')
    }));
}

/**
 * Run a single migration
 */
async function runMigration(pool: Pool, migration: IMigrationFile): Promise<void> {
    logger.info(`Running migration: ${migration.name}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Execute the migration SQL
        await client.query(migration.content);

        // Mark as applied
        await client.query(`INSERT INTO _migrations (name) VALUES ($1)`, [migration.name]);

        await client.query('COMMIT');
        logger.info(`Migration applied: ${migration.name}`);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Migration failed: ${migration.name}`, { error });
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
    const pool = createPool();

    try {
        // Ensure migrations table exists
        await ensureMigrationTable(pool);

        // Get applied migrations
        const applied = await getAppliedMigrations(pool);
        logger.info(`Applied migrations: ${applied.length}`);

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrations = getMigrationFiles(migrationsDir);
        logger.info(`Total migration files: ${migrations.length}`);

        // Find pending migrations
        const pending = migrations.filter(m => !applied.includes(m.name));
        logger.info(`Pending migrations: ${pending.length}`);

        if (pending.length === 0) {
            logger.info('No pending migrations');
            return;
        }

        // Run each pending migration
        for (const migration of pending) {
            await runMigration(pool, migration);
        }

        logger.info(`Successfully applied ${pending.length} migrations`);
    } finally {
        await pool.end();
    }
}

/**
 * Show migration status
 */
async function showStatus(): Promise<void> {
    const pool = createPool();

    try {
        await ensureMigrationTable(pool);

        const applied = await getAppliedMigrations(pool);
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrations = getMigrationFiles(migrationsDir);

        console.log('\n📊 Migration Status\n');
        console.log('═'.repeat(60));

        for (const migration of migrations) {
            const status = applied.includes(migration.name) ? '✅' : '⏳';
            console.log(`${status} ${migration.name}`);
        }

        console.log('═'.repeat(60));
        console.log(`\nApplied: ${applied.length}/${migrations.length}`);
        console.log(`Pending: ${migrations.length - applied.length}`);
    } finally {
        await pool.end();
    }
}

// ==================== CLI ====================

const command = process.argv[2];

switch (command) {
    case 'up':
    case 'run':
        runMigrations()
            .then(() => {
                logger.info('Migration complete');
                process.exit(0);
            })
            .catch(err => {
                logger.error('Migration failed', { error: err });
                process.exit(1);
            });
        break;

    case 'status':
        showStatus()
            .then(() => process.exit(0))
            .catch(err => {
                logger.error('Status check failed', { error: err });
                process.exit(1);
            });
        break;

    default:
        console.log(`
Usage: npm run migrate [command]

Commands:
  run        Run all pending migrations
  status     Show migration status

Examples:
  npm run migrate
  npm run migrate:status
        `);
        process.exit(0);
}

export { runMigrations, showStatus };
