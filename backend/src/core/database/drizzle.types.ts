/**
 * Drizzle ORM Type Definitions
 * Enterprise-grade type definitions for type-safe database operations
 * 
 * Following SOLID Principles:
 * - Single Responsibility: Only type definitions
 * - Open/Closed: Extendable through generics
 * - Interface Segregation: Focused interfaces
 */

import type {
    PgTableWithColumns,
    PgColumn,
    TableConfig
} from 'drizzle-orm/pg-core';
import type { SQL, InferInsertModel, InferSelectModel } from 'drizzle-orm';

// ==================== TABLE TYPES ====================

/**
 * Base table configuration for all Postgres tables
 */
export interface BasePgTableConfig extends TableConfig {
    name: string;
    schema: string | undefined;
    dialect: 'pg';
}

/**
 * Type for any Postgres table with columns
 */
export type AnyPgTable = PgTableWithColumns<BasePgTableConfig>;

/**
 * Type for any Postgres column
 * Note: Using any escape hatch as Drizzle's PgColumn generics are extremely complex
 * This is the recommended approach per Drizzle's documentation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgColumn = PgColumn<any, object, object>;

// ==================== ENTITY TYPES ====================

/**
 * Base entity interface - all entities must have an id
 */
export interface IBaseEntity {
    readonly id: string;
}

/**
 * Auditable entity with timestamps
 */
export interface IAuditableEntity extends IBaseEntity {
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * Soft-deletable entity
 */
export interface ISoftDeletableEntity extends IAuditableEntity {
    readonly deletedAt: Date | null;
}

// ==================== REPOSITORY TYPES ====================

/**
 * Insert model type for a table
 */
export type InsertModel<T extends AnyPgTable> = InferInsertModel<T>;

/**
 * Select model type for a table
 */
export type SelectModel<T extends AnyPgTable> = InferSelectModel<T>;

/**
 * Pagination options for queries
 */
export interface IPaginationOptions {
    readonly page?: number;
    readonly limit?: number;
    readonly sortBy?: string;
    readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface IPaginatedResult<T> {
    readonly data: T[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
}

/**
 * Query options for find operations
 */
export interface IQueryOptions<T> {
    readonly where?: SQL;
    readonly orderBy?: SQL;
    readonly limit?: number;
    readonly offset?: number;
    readonly select?: (keyof T)[];
}

/**
 * Repository configuration
 */
export interface IRepositoryConfig {
    /** Enable soft delete (requires deletedAt column) */
    readonly softDelete?: boolean;
    /** Enable OpenTelemetry tracing */
    readonly enableTracing?: boolean;
    /** Table name for logging/tracing */
    readonly tableName?: string;
}

// ==================== TYPE GUARDS ====================

/**
 * Check if entity has soft delete capability
 */
export function isSoftDeletable(entity: unknown): entity is ISoftDeletableEntity {
    return (
        typeof entity === 'object' &&
        entity !== null &&
        'deletedAt' in entity
    );
}

/**
 * Check if entity is auditable
 */
export function isAuditable(entity: unknown): entity is IAuditableEntity {
    return (
        typeof entity === 'object' &&
        entity !== null &&
        'createdAt' in entity &&
        'updatedAt' in entity
    );
}
