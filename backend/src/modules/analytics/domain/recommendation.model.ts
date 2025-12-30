/**
 * Recommendation Domain Models
 * Types for intelligent business recommendations
 */

// ==================== RECOMMENDATION TYPES ====================

export type RecommendationCategory = 'stock' | 'optimization' | 'capacity' | 'cost' | 'quality';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationStatus = 'active' | 'dismissed' | 'applied' | 'expired';

export interface IRecommendation {
    id: string;
    category: RecommendationCategory;
    priority: RecommendationPriority;
    status: RecommendationStatus;
    title: string;
    description: string;
    reasoning: string;
    createdAt: Date;
    validUntil: Date;
    appliedAt?: Date;
    dismissedAt?: Date;
    tenantId?: string;

    // Actionable data
    action?: IRecommendationAction;

    // Impact estimation
    impact?: IRecommendationImpact;

    // Related entities
    relatedEntities?: IRelatedEntity[];
}

export interface IRecommendationAction {
    type: string;
    label: string;
    params: Record<string, unknown>;
    confirmationRequired?: boolean;
}

export interface IRecommendationImpact {
    metric: string;
    currentValue: number;
    projectedValue: number;
    improvementPercent: number;
    confidence: number;
}

export interface IRelatedEntity {
    type: 'stock' | 'order' | 'machine' | 'material' | 'customer';
    id: string;
    name: string;
}

export interface IRecommendationFilter {
    category?: RecommendationCategory;
    priority?: RecommendationPriority;
    status?: RecommendationStatus;
    limit?: number;
}

// ==================== RECOMMENDATION RULES ====================

export interface IRecommendationRule {
    id: string;
    name: string;
    category: RecommendationCategory;
    enabled: boolean;
    priority: RecommendationPriority;

    // Condition evaluation
    condition: {
        metric: string;
        operator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte' | 'between';
        threshold: number | [number, number];
        lookbackDays?: number;
    };

    // Template for recommendation
    template: {
        titleTemplate: string;
        descriptionTemplate: string;
        actionType?: string;
    };
}

// ==================== STOCK RECOMMENDATION SPECIFICS ====================

export interface IStockRecommendation extends IRecommendation {
    category: 'stock';
    stockData: {
        materialTypeId: string;
        materialName: string;
        currentQuantity: number;
        reorderLevel: number;
        averageConsumption: number;
        daysUntilStockout: number;
    };
}

// ==================== OPTIMIZATION RECOMMENDATION SPECIFICS ====================

export interface IOptimizationRecommendation extends IRecommendation {
    category: 'optimization';
    optimizationData: {
        jobIds: string[];
        potentialWasteSaving: number;
        estimatedTimeReduction: number;
        suggestedStrategy: string;
    };
}

// ==================== CAPACITY RECOMMENDATION SPECIFICS ====================

export interface ICapacityRecommendation extends IRecommendation {
    category: 'capacity';
    capacityData: {
        machineId: string;
        machineName: string;
        currentUtilization: number;
        optimalUtilization: number;
        availableSlots: number;
    };
}

// ==================== RESULT TYPES ====================

export interface IRecommendationResult {
    recommendations: IRecommendation[];
    generated: number;
    byCategory: Record<RecommendationCategory, number>;
    byPriority: Record<RecommendationPriority, number>;
}
