/**
 * Analytics Query Validation
 * Zod schemas for type-safe query parameter handling
 * 
 * Following U-AIER: Input validation at boundaries
 */

import { z } from 'zod';

// ==================== ANOMALY FILTER SCHEMA ====================

const AnomalyTypeEnum = z.enum(['spike', 'drop', 'outlier', 'pattern', 'trend_break']);
const AnomalySeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const AnomalyStatusEnum = z.enum(['new', 'acknowledged', 'resolved', 'ignored']);

export const AnomalyFilterSchema = z.object({
    type: AnomalyTypeEnum.optional(),
    severity: AnomalySeverityEnum.optional(),
    status: AnomalyStatusEnum.optional(),
    metric: z.string().optional(),
    since: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    until: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    limit: z.coerce.number().int().min(1).max(500).default(50)
});

export type ValidatedAnomalyFilter = z.infer<typeof AnomalyFilterSchema>;

// ==================== RECOMMENDATION FILTER SCHEMA ====================

// Must match RecommendationCategory from domain
const RecommendationCategoryEnum = z.enum([
    'stock',
    'optimization',
    'capacity',
    'cost',
    'quality'
]);

// Must match RecommendationPriority from domain
const RecommendationPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const RecommendationFilterSchema = z.object({
    category: RecommendationCategoryEnum.optional(),
    priority: RecommendationPriorityEnum.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type ValidatedRecommendationFilter = z.infer<typeof RecommendationFilterSchema>;

// ==================== FORECAST QUERY SCHEMA ====================

const ForecastMetricEnum = z.enum([
    'orders',
    'production',
    'waste',
    'stock_consumption',
    'demand'
]);

const ForecastPeriodEnum = z.enum(['hour', 'day', 'week', 'month']);

export const ForecastQuerySchema = z.object({
    metric: ForecastMetricEnum,
    period: ForecastPeriodEnum.default('day'),
    horizon: z.coerce.number().int().min(1).max(90).default(7),
    materialTypeId: z.string().uuid().optional()
});

export type ValidatedForecastQuery = z.infer<typeof ForecastQuerySchema>;

// ==================== VALIDATION HELPERS ====================

export interface IValidationError {
    field: string;
    message: string;
}

export function validateAnomalyFilter(query: Record<string, unknown>): {
    success: boolean;
    data?: ValidatedAnomalyFilter;
    errors?: IValidationError[];
} {
    const result = AnomalyFilterSchema.safeParse(query);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    };
}

export function validateRecommendationFilter(query: Record<string, unknown>): {
    success: boolean;
    data?: ValidatedRecommendationFilter;
    errors?: IValidationError[];
} {
    const result = RecommendationFilterSchema.safeParse(query);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    };
}

export function validateForecastQuery(query: Record<string, unknown>): {
    success: boolean;
    data?: ValidatedForecastQuery;
    errors?: IValidationError[];
} {
    const result = ForecastQuerySchema.safeParse(query);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    };
}

// ==================== METRIC TYPE ====================

export type MetricType = 'orders' | 'production' | 'waste' | 'stock_consumption' | 'demand';

export function isValidMetricType(value: string): value is MetricType {
    return ['orders', 'production', 'waste', 'stock_consumption', 'demand'].includes(value);
}
