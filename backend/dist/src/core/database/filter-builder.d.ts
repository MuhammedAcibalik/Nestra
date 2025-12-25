/**
 * Filter Builder
 * Utility for building type-safe dynamic WHERE clauses
 */
import { SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'between';
export interface FilterCondition<T = unknown> {
    column: PgColumn;
    operator: FilterOperator;
    value?: T;
    valueTo?: T;
}
/**
 * Fluent builder for constructing type-safe WHERE clauses.
 *
 * @example
 * ```typescript
 * const filter = createFilter()
 *     .eq(orders.status, 'PENDING')
 *     .gte(orders.priority, 5)
 *     .dateRange(orders.createdAt, startDate, endDate)
 *     .search(orders.notes, searchTerm)
 *     .build();
 * ```
 */
export declare class FilterBuilder {
    private conditions;
    /**
     * Add a raw condition
     */
    add(condition: SQL | undefined): this;
    /**
     * Add condition only if predicate is true
     */
    addIf(predicate: boolean, condition: SQL | undefined): this;
    /**
     * Equal comparison (skips if value is undefined/null)
     */
    eq<T>(column: PgColumn, value: T | undefined | null): this;
    /**
     * Not equal comparison
     */
    ne<T>(column: PgColumn, value: T | undefined | null): this;
    /**
     * Greater than comparison
     */
    gt<T>(column: PgColumn, value: T | undefined | null): this;
    /**
     * Greater than or equal comparison
     */
    gte<T>(column: PgColumn, value: T | undefined | null): this;
    /**
     * Less than comparison
     */
    lt<T>(column: PgColumn, value: T | undefined | null): this;
    /**
     * Less than or equal comparison
     */
    lte<T>(column: PgColumn, value: T | undefined | null): this;
    /**
     * Case-sensitive pattern match
     */
    like(column: PgColumn, value: string | undefined | null): this;
    /**
     * Case-insensitive pattern match (recommended for search)
     */
    ilike(column: PgColumn, value: string | undefined | null): this;
    /**
     * Alias for ilike - case-insensitive search
     */
    search(column: PgColumn, value: string | undefined | null): this;
    /**
     * Value in array
     */
    in<T>(column: PgColumn, values: T[] | undefined | null): this;
    /**
     * Value not in array
     */
    notIn<T>(column: PgColumn, values: T[] | undefined | null): this;
    /**
     * Value is NULL
     */
    isNull(column: PgColumn): this;
    /**
     * Value is NOT NULL
     */
    isNotNull(column: PgColumn): this;
    /**
     * Value between two values (inclusive)
     */
    between<T>(column: PgColumn, from: T | undefined, to: T | undefined): this;
    /**
     * Date range filter (start and/or end date)
     */
    dateRange(column: PgColumn, startDate?: Date | string | null, endDate?: Date | string | null): this;
    /**
     * Combine conditions with OR (creates subgroup)
     */
    or(...conditions: (SQL | undefined)[]): this;
    /**
     * Build final WHERE clause
     * Returns undefined if no conditions (allows full table scan)
     */
    build(): SQL | undefined;
    /**
     * Build with guaranteed SQL return (uses 1=1 if empty)
     */
    buildRequired(): SQL;
    /**
     * Check if builder has any conditions
     */
    hasConditions(): boolean;
    /**
     * Get count of conditions
     */
    count(): number;
    /**
     * Clear all conditions
     */
    clear(): this;
}
/**
 * Create a new FilterBuilder instance
 */
export declare function createFilter(): FilterBuilder;
/**
 * Quick filter for single equality check
 */
export declare function filterEq<T>(column: PgColumn, value: T | undefined): SQL | undefined;
/**
 * Quick filter for date range
 */
export declare function filterDateRange(column: PgColumn, startDate?: Date | null, endDate?: Date | null): SQL | undefined;
//# sourceMappingURL=filter-builder.d.ts.map