/**
 * Database Types
 * Shared type definitions for database operations
 */

import { SQL } from 'drizzle-orm';

// ==================== PAGINATION ====================

export interface PaginationOptions {
    /** Page number (1-indexed) */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Sort column name */
    sortBy?: string;
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ==================== QUERY OPTIONS ====================

export interface QueryOptions {
    /** Where conditions */
    where?: SQL;
    /** Pagination options */
    pagination?: PaginationOptions;
    /** Include soft-deleted records */
    includeSoftDeleted?: boolean;
}

// ==================== ENTITY TRAITS ====================

export interface HasId {
    id: string;
}

export interface HasTimestamps {
    createdAt: Date;
    updatedAt: Date;
}

export interface HasSoftDelete {
    deletedAt: Date | null;
}

export interface HasTenant {
    tenantId: string | null;
}

export interface HasAudit {
    createdById?: string | null;
    updatedById?: string | null;
}

// ==================== COMMON ENTITY ====================

export interface BaseEntity extends HasId, HasTimestamps { }

export interface TenantEntity extends BaseEntity, HasTenant { }

export interface AuditableEntity extends BaseEntity, HasAudit { }

export interface FullEntity extends BaseEntity, HasTenant, HasSoftDelete, HasAudit { }
