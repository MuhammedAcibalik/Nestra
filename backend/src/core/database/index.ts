/**
 * Core Database Module
 * Barrel export for database utilities
 */

// Types
export * from './types';

// Query Building
export { FilterBuilder, createFilter, filterEq, filterDateRange } from './filter-builder';
export type { FilterOperator, FilterCondition } from './filter-builder';

// Transaction Utilities
export { withTransaction, batchTransaction, withRetry } from './transaction';
export type { TransactionCallback, TransactionOptions } from './transaction';

// Base Repository
export { EnhancedBaseRepository } from './base.repository';
export type { RepositoryConfig } from './base.repository';

// Tenant-Aware Repository
export { TenantAwareRepository } from './tenant.repository';
export type { TenantRepositoryConfig } from './tenant.repository';

