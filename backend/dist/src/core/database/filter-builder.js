"use strict";
/**
 * Filter Builder
 * Utility for building type-safe dynamic WHERE clauses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBuilder = void 0;
exports.createFilter = createFilter;
exports.filterEq = filterEq;
exports.filterDateRange = filterDateRange;
const drizzle_orm_1 = require("drizzle-orm");
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
class FilterBuilder {
    conditions = [];
    /**
     * Add a raw condition
     */
    add(condition) {
        if (condition)
            this.conditions.push(condition);
        return this;
    }
    /**
     * Add condition only if predicate is true
     */
    addIf(predicate, condition) {
        if (predicate && condition)
            this.conditions.push(condition);
        return this;
    }
    /**
     * Equal comparison (skips if value is undefined/null)
     */
    eq(column, value) {
        if (value !== undefined && value !== null) {
            this.conditions.push((0, drizzle_orm_1.eq)(column, value));
        }
        return this;
    }
    /**
     * Not equal comparison
     */
    ne(column, value) {
        if (value !== undefined && value !== null) {
            this.conditions.push((0, drizzle_orm_1.ne)(column, value));
        }
        return this;
    }
    /**
     * Greater than comparison
     */
    gt(column, value) {
        if (value !== undefined && value !== null) {
            this.conditions.push((0, drizzle_orm_1.gt)(column, value));
        }
        return this;
    }
    /**
     * Greater than or equal comparison
     */
    gte(column, value) {
        if (value !== undefined && value !== null) {
            this.conditions.push((0, drizzle_orm_1.gte)(column, value));
        }
        return this;
    }
    /**
     * Less than comparison
     */
    lt(column, value) {
        if (value !== undefined && value !== null) {
            this.conditions.push((0, drizzle_orm_1.lt)(column, value));
        }
        return this;
    }
    /**
     * Less than or equal comparison
     */
    lte(column, value) {
        if (value !== undefined && value !== null) {
            this.conditions.push((0, drizzle_orm_1.lte)(column, value));
        }
        return this;
    }
    /**
     * Case-sensitive pattern match
     */
    like(column, value) {
        if (value?.trim()) {
            this.conditions.push((0, drizzle_orm_1.like)(column, `%${value.trim()}%`));
        }
        return this;
    }
    /**
     * Case-insensitive pattern match (recommended for search)
     */
    ilike(column, value) {
        if (value?.trim()) {
            this.conditions.push((0, drizzle_orm_1.ilike)(column, `%${value.trim()}%`));
        }
        return this;
    }
    /**
     * Alias for ilike - case-insensitive search
     */
    search(column, value) {
        return this.ilike(column, value);
    }
    /**
     * Value in array
     */
    in(column, values) {
        if (values && values.length > 0) {
            this.conditions.push((0, drizzle_orm_1.inArray)(column, values));
        }
        return this;
    }
    /**
     * Value not in array
     */
    notIn(column, values) {
        if (values && values.length > 0) {
            this.conditions.push((0, drizzle_orm_1.notInArray)(column, values));
        }
        return this;
    }
    /**
     * Value is NULL
     */
    isNull(column) {
        this.conditions.push((0, drizzle_orm_1.isNull)(column));
        return this;
    }
    /**
     * Value is NOT NULL
     */
    isNotNull(column) {
        this.conditions.push((0, drizzle_orm_1.isNotNull)(column));
        return this;
    }
    /**
     * Value between two values (inclusive)
     */
    between(column, from, to) {
        if (from !== undefined && to !== undefined) {
            this.conditions.push((0, drizzle_orm_1.between)(column, from, to));
        }
        else if (from !== undefined) {
            this.conditions.push((0, drizzle_orm_1.gte)(column, from));
        }
        else if (to !== undefined) {
            this.conditions.push((0, drizzle_orm_1.lte)(column, to));
        }
        return this;
    }
    /**
     * Date range filter (start and/or end date)
     */
    dateRange(column, startDate, endDate) {
        if (startDate) {
            const start = startDate instanceof Date ? startDate : new Date(startDate);
            this.conditions.push((0, drizzle_orm_1.gte)(column, start));
        }
        if (endDate) {
            const end = endDate instanceof Date ? endDate : new Date(endDate);
            this.conditions.push((0, drizzle_orm_1.lte)(column, end));
        }
        return this;
    }
    /**
     * Combine conditions with OR (creates subgroup)
     */
    or(...conditions) {
        const validConditions = conditions.filter((c) => c !== undefined);
        if (validConditions.length > 0) {
            this.conditions.push((0, drizzle_orm_1.or)(...validConditions));
        }
        return this;
    }
    /**
     * Build final WHERE clause
     * Returns undefined if no conditions (allows full table scan)
     */
    build() {
        if (this.conditions.length === 0)
            return undefined;
        if (this.conditions.length === 1)
            return this.conditions[0];
        return (0, drizzle_orm_1.and)(...this.conditions);
    }
    /**
     * Build with guaranteed SQL return (uses 1=1 if empty)
     */
    buildRequired() {
        return this.build() ?? (0, drizzle_orm_1.sql) `1=1`;
    }
    /**
     * Check if builder has any conditions
     */
    hasConditions() {
        return this.conditions.length > 0;
    }
    /**
     * Get count of conditions
     */
    count() {
        return this.conditions.length;
    }
    /**
     * Clear all conditions
     */
    clear() {
        this.conditions = [];
        return this;
    }
}
exports.FilterBuilder = FilterBuilder;
// ==================== FACTORY ====================
/**
 * Create a new FilterBuilder instance
 */
function createFilter() {
    return new FilterBuilder();
}
/**
 * Quick filter for single equality check
 */
function filterEq(column, value) {
    if (value === undefined || value === null)
        return undefined;
    return (0, drizzle_orm_1.eq)(column, value);
}
/**
 * Quick filter for date range
 */
function filterDateRange(column, startDate, endDate) {
    return createFilter().dateRange(column, startDate, endDate).build();
}
//# sourceMappingURL=filter-builder.js.map