/**
 * Filter Builder
 * Utility for building type-safe dynamic WHERE clauses
 */

import {
    SQL,
    and,
    or,
    eq,
    ne,
    gte,
    lte,
    gt,
    lt,
    like,
    ilike,
    inArray,
    notInArray,
    isNull,
    isNotNull,
    between,
    sql
} from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

// ==================== TYPES ====================

export type FilterOperator =
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'like'
    | 'ilike'
    | 'in'
    | 'notIn'
    | 'isNull'
    | 'isNotNull'
    | 'between';

export interface FilterCondition<T = unknown> {
    column: PgColumn;
    operator: FilterOperator;
    value?: T;
    valueTo?: T; // For 'between' operator
}

// ==================== FILTER BUILDER ====================

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
export class FilterBuilder {
    private conditions: SQL[] = [];

    /**
     * Add a raw condition
     */
    add(condition: SQL | undefined): this {
        if (condition) this.conditions.push(condition);
        return this;
    }

    /**
     * Add condition only if predicate is true
     */
    addIf(predicate: boolean, condition: SQL | undefined): this {
        if (predicate && condition) this.conditions.push(condition);
        return this;
    }

    /**
     * Equal comparison (skips if value is undefined/null)
     */
    eq<T>(column: PgColumn, value: T | undefined | null): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(eq(column, value));
        }
        return this;
    }

    /**
     * Not equal comparison
     */
    ne<T>(column: PgColumn, value: T | undefined | null): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(ne(column, value));
        }
        return this;
    }

    /**
     * Greater than comparison
     */
    gt<T>(column: PgColumn, value: T | undefined | null): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(gt(column, value));
        }
        return this;
    }

    /**
     * Greater than or equal comparison
     */
    gte<T>(column: PgColumn, value: T | undefined | null): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(gte(column, value));
        }
        return this;
    }

    /**
     * Less than comparison
     */
    lt<T>(column: PgColumn, value: T | undefined | null): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(lt(column, value));
        }
        return this;
    }

    /**
     * Less than or equal comparison
     */
    lte<T>(column: PgColumn, value: T | undefined | null): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(lte(column, value));
        }
        return this;
    }

    /**
     * Case-sensitive pattern match
     */
    like(column: PgColumn, value: string | undefined | null): this {
        if (value?.trim()) {
            this.conditions.push(like(column, `%${value.trim()}%`));
        }
        return this;
    }

    /**
     * Case-insensitive pattern match (recommended for search)
     */
    ilike(column: PgColumn, value: string | undefined | null): this {
        if (value?.trim()) {
            this.conditions.push(ilike(column, `%${value.trim()}%`));
        }
        return this;
    }

    /**
     * Alias for ilike - case-insensitive search
     */
    search(column: PgColumn, value: string | undefined | null): this {
        return this.ilike(column, value);
    }

    /**
     * Value in array
     */
    in<T>(column: PgColumn, values: T[] | undefined | null): this {
        if (values && values.length > 0) {
            this.conditions.push(inArray(column, values));
        }
        return this;
    }

    /**
     * Value not in array
     */
    notIn<T>(column: PgColumn, values: T[] | undefined | null): this {
        if (values && values.length > 0) {
            this.conditions.push(notInArray(column, values));
        }
        return this;
    }

    /**
     * Value is NULL
     */
    isNull(column: PgColumn): this {
        this.conditions.push(isNull(column));
        return this;
    }

    /**
     * Value is NOT NULL
     */
    isNotNull(column: PgColumn): this {
        this.conditions.push(isNotNull(column));
        return this;
    }

    /**
     * Value between two values (inclusive)
     */
    between<T>(column: PgColumn, from: T | undefined, to: T | undefined): this {
        if (from !== undefined && to !== undefined) {
            this.conditions.push(between(column, from, to));
        } else if (from !== undefined) {
            this.conditions.push(gte(column, from));
        } else if (to !== undefined) {
            this.conditions.push(lte(column, to));
        }
        return this;
    }

    /**
     * Date range filter (start and/or end date)
     */
    dateRange(column: PgColumn, startDate?: Date | string | null, endDate?: Date | string | null): this {
        if (startDate) {
            const start = startDate instanceof Date ? startDate : new Date(startDate);
            this.conditions.push(gte(column, start));
        }
        if (endDate) {
            const end = endDate instanceof Date ? endDate : new Date(endDate);
            this.conditions.push(lte(column, end));
        }
        return this;
    }

    /**
     * Combine conditions with OR (creates subgroup)
     */
    or(...conditions: (SQL | undefined)[]): this {
        const validConditions = conditions.filter((c): c is SQL => c !== undefined);
        if (validConditions.length > 0) {
            this.conditions.push(or(...validConditions)!);
        }
        return this;
    }

    /**
     * Build final WHERE clause
     * Returns undefined if no conditions (allows full table scan)
     */
    build(): SQL | undefined {
        if (this.conditions.length === 0) return undefined;
        if (this.conditions.length === 1) return this.conditions[0];
        return and(...this.conditions);
    }

    /**
     * Build with guaranteed SQL return (uses 1=1 if empty)
     */
    buildRequired(): SQL {
        return this.build() ?? sql`1=1`;
    }

    /**
     * Check if builder has any conditions
     */
    hasConditions(): boolean {
        return this.conditions.length > 0;
    }

    /**
     * Get count of conditions
     */
    count(): number {
        return this.conditions.length;
    }

    /**
     * Clear all conditions
     */
    clear(): this {
        this.conditions = [];
        return this;
    }
}

// ==================== FACTORY ====================

/**
 * Create a new FilterBuilder instance
 */
export function createFilter(): FilterBuilder {
    return new FilterBuilder();
}

/**
 * Quick filter for single equality check
 */
export function filterEq<T>(column: PgColumn, value: T | undefined): SQL | undefined {
    if (value === undefined || value === null) return undefined;
    return eq(column, value);
}

/**
 * Quick filter for date range
 */
export function filterDateRange(column: PgColumn, startDate?: Date | null, endDate?: Date | null): SQL | undefined {
    return createFilter().dateRange(column, startDate, endDate).build();
}
