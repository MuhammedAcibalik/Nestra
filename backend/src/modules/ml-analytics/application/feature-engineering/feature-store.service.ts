/**
 * Feature Store Service
 * Centralized feature management with versioning, caching, and statistics
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('FeatureStore');

// ==================== TYPES ====================

type IServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export interface IFeatureDefinition {
    id: string;
    name: string;
    dataType: 'numeric' | 'categorical' | 'boolean' | 'array';
    source: string;                    // e.g., 'job.items', 'stock.dimensions'
    transformation?: ITransformation;
    normalization?: INormalization;
    description?: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITransformation {
    type: 'log' | 'sqrt' | 'power' | 'normalize' | 'standardize' | 'one_hot' | 'custom';
    params?: Record<string, number | string>;
}

export interface INormalization {
    type: 'min_max' | 'z_score' | 'robust';
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
    median?: number;
    iqr?: number;
}

export interface IFeatureSet {
    id: string;
    name: string;
    description?: string;
    modelType: string;
    features: string[];  // Feature IDs
    version: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFeatureStatistics {
    featureId: string;
    sampleCount: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
    percentiles: { p25: number; p50: number; p75: number; p95: number; p99: number };
    nullCount: number;
    uniqueCount?: number;
    histogram?: { bucket: string; count: number }[];
    lastUpdated: Date;
}

export interface ICachedFeature {
    key: string;
    featureId: string;
    value: number | string | boolean | number[];
    version: number;
    cachedAt: Date;
    expiresAt: Date;
}

// ==================== SERVICE ====================

export class FeatureStoreService {
    // In-memory stores (would be Redis/DB in production)
    private definitions: Map<string, IFeatureDefinition> = new Map();
    private featureSets: Map<string, IFeatureSet> = new Map();
    private statistics: Map<string, IFeatureStatistics> = new Map();
    private cache: Map<string, ICachedFeature> = new Map();

    private readonly defaultCacheTTL = 60 * 60 * 1000; // 1 hour

    constructor(
        private readonly db?: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) {
        this.initializeDefaultFeatures();
    }

    // ==================== INITIALIZATION ====================

    private initializeDefaultFeatures(): void {
        // Waste Prediction Features
        this.registerFeature({
            name: 'piece_count',
            dataType: 'numeric',
            source: 'job.items',
            description: 'Total number of pieces to cut',
            transformation: { type: 'log' }
        });

        this.registerFeature({
            name: 'total_piece_area',
            dataType: 'numeric',
            source: 'job.items',
            description: 'Sum of all piece areas',
            normalization: { type: 'z_score' }
        });

        this.registerFeature({
            name: 'avg_piece_area',
            dataType: 'numeric',
            source: 'job.items',
            description: 'Average area per piece'
        });

        this.registerFeature({
            name: 'piece_area_variance',
            dataType: 'numeric',
            source: 'job.items',
            description: 'Variance in piece areas'
        });

        this.registerFeature({
            name: 'stock_count',
            dataType: 'numeric',
            source: 'stock',
            description: 'Available stock count'
        });

        this.registerFeature({
            name: 'total_stock_area',
            dataType: 'numeric',
            source: 'stock',
            description: 'Total available stock area'
        });

        this.registerFeature({
            name: 'area_ratio',
            dataType: 'numeric',
            source: 'calculated',
            description: 'Piece area / Stock area ratio'
        });

        this.registerFeature({
            name: 'kerf_width',
            dataType: 'numeric',
            source: 'params',
            description: 'Cutting blade width'
        });

        this.registerFeature({
            name: 'allow_rotation',
            dataType: 'boolean',
            source: 'params',
            description: 'Whether pieces can be rotated'
        });

        this.registerFeature({
            name: 'material_type',
            dataType: 'categorical',
            source: 'job',
            description: 'Material type identifier',
            transformation: { type: 'one_hot' }
        });

        this.registerFeature({
            name: 'thickness',
            dataType: 'numeric',
            source: 'job',
            description: 'Material thickness'
        });

        this.registerFeature({
            name: 'historical_avg_waste',
            dataType: 'numeric',
            source: 'historical',
            description: 'Historical average waste percentage'
        });

        logger.info('Default features initialized', { count: this.definitions.size });
    }

    // ==================== FEATURE DEFINITION MANAGEMENT ====================

    /**
     * Register a new feature definition
     */
    registerFeature(input: Omit<IFeatureDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>): IServiceResult<IFeatureDefinition> {
        const id = uuid();
        const now = new Date();

        const definition: IFeatureDefinition = {
            id,
            ...input,
            version: 1,
            createdAt: now,
            updatedAt: now
        };

        this.definitions.set(id, definition);
        logger.debug('Feature registered', { id, name: definition.name });

        return { success: true, data: definition };
    }

    /**
     * Update feature definition (creates new version)
     */
    updateFeature(featureId: string, updates: Partial<Omit<IFeatureDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>>): IServiceResult<IFeatureDefinition> {
        const existing = this.definitions.get(featureId);
        if (!existing) {
            return { success: false, error: 'Feature not found' };
        }

        const updated: IFeatureDefinition = {
            ...existing,
            ...updates,
            version: existing.version + 1,
            updatedAt: new Date()
        };

        this.definitions.set(featureId, updated);
        logger.info('Feature updated', { id: featureId, version: updated.version });

        return { success: true, data: updated };
    }

    /**
     * Get feature definition by ID
     */
    getFeature(featureId: string): IServiceResult<IFeatureDefinition> {
        const definition = this.definitions.get(featureId);
        if (!definition) {
            return { success: false, error: 'Feature not found' };
        }
        return { success: true, data: definition };
    }

    /**
     * Get feature by name
     */
    getFeatureByName(name: string): IServiceResult<IFeatureDefinition> {
        for (const def of this.definitions.values()) {
            if (def.name === name) {
                return { success: true, data: def };
            }
        }
        return { success: false, error: `Feature '${name}' not found` };
    }

    /**
     * List all feature definitions
     */
    listFeatures(): IFeatureDefinition[] {
        return Array.from(this.definitions.values());
    }

    // ==================== FEATURE SET MANAGEMENT ====================

    /**
     * Create a feature set for a model
     */
    createFeatureSet(input: {
        name: string;
        description?: string;
        modelType: string;
        features: string[];
    }): IServiceResult<IFeatureSet> {
        const id = uuid();
        const now = new Date();

        const featureSet: IFeatureSet = {
            id,
            name: input.name,
            description: input.description,
            modelType: input.modelType,
            features: input.features,
            version: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now
        };

        this.featureSets.set(id, featureSet);
        logger.info('Feature set created', { id, name: input.name, modelType: input.modelType });

        return { success: true, data: featureSet };
    }

    /**
     * Get active feature set for a model type
     */
    getActiveFeatureSet(modelType: string): IServiceResult<IFeatureSet> {
        for (const set of this.featureSets.values()) {
            if (set.modelType === modelType && set.isActive) {
                return { success: true, data: set };
            }
        }
        return { success: false, error: `No active feature set for ${modelType}` };
    }

    /**
     * List all feature sets
     */
    listFeatureSets(modelType?: string): IFeatureSet[] {
        const sets = Array.from(this.featureSets.values());
        if (modelType) {
            return sets.filter(s => s.modelType === modelType);
        }
        return sets;
    }

    // ==================== FEATURE TRANSFORMATION ====================

    /**
     * Apply transformation to a value
     */
    applyTransformation(value: number, transformation: ITransformation): number {
        switch (transformation.type) {
            case 'log':
                return Math.log(value + 1); // log1p to handle 0
            case 'sqrt':
                return Math.sqrt(Math.abs(value));
            case 'power':
                const power = Number(transformation.params?.power ?? 2);
                return Math.pow(value, power);
            case 'normalize':
            case 'standardize':
                // Requires normalization params - handled separately
                return value;
            default:
                return value;
        }
    }

    /**
     * Apply normalization to a value
     */
    applyNormalization(value: number, norm: INormalization): number {
        switch (norm.type) {
            case 'min_max':
                if (norm.min !== undefined && norm.max !== undefined && norm.max !== norm.min) {
                    return (value - norm.min) / (norm.max - norm.min);
                }
                return value;
            case 'z_score':
                if (norm.mean !== undefined && norm.std !== undefined && norm.std !== 0) {
                    return (value - norm.mean) / norm.std;
                }
                return value;
            case 'robust':
                if (norm.median !== undefined && norm.iqr !== undefined && norm.iqr !== 0) {
                    return (value - norm.median) / norm.iqr;
                }
                return value;
            default:
                return value;
        }
    }

    /**
     * Transform feature value using definition
     */
    transformFeature(featureId: string, rawValue: number): IServiceResult<number> {
        const definition = this.definitions.get(featureId);
        if (!definition) {
            return { success: false, error: 'Feature not found' };
        }

        let value = rawValue;

        // Apply transformation
        if (definition.transformation) {
            value = this.applyTransformation(value, definition.transformation);
        }

        // Apply normalization
        if (definition.normalization) {
            value = this.applyNormalization(value, definition.normalization);
        }

        return { success: true, data: value };
    }

    // ==================== FEATURE STATISTICS ====================

    /**
     * Update statistics for a feature
     */
    updateStatistics(featureId: string, values: number[]): IServiceResult<IFeatureStatistics> {
        if (values.length === 0) {
            return { success: false, error: 'No values provided' };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;

        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const std = Math.sqrt(variance);

        const stats: IFeatureStatistics = {
            featureId,
            sampleCount: n,
            mean,
            std,
            min: sorted[0],
            max: sorted[n - 1],
            median: sorted[Math.floor(n / 2)],
            percentiles: {
                p25: sorted[Math.floor(n * 0.25)],
                p50: sorted[Math.floor(n * 0.50)],
                p75: sorted[Math.floor(n * 0.75)],
                p95: sorted[Math.floor(n * 0.95)],
                p99: sorted[Math.floor(n * 0.99)]
            },
            nullCount: 0,
            lastUpdated: new Date()
        };

        this.statistics.set(featureId, stats);
        logger.debug('Statistics updated', { featureId, sampleCount: n });

        // Update normalization params in definition
        const def = this.definitions.get(featureId);
        if (def && def.normalization) {
            def.normalization.mean = mean;
            def.normalization.std = std;
            def.normalization.min = stats.min;
            def.normalization.max = stats.max;
            def.normalization.median = stats.median;
            def.normalization.iqr = stats.percentiles.p75 - stats.percentiles.p25;
            this.definitions.set(featureId, def);
        }

        return { success: true, data: stats };
    }

    /**
     * Get statistics for a feature
     */
    getStatistics(featureId: string): IServiceResult<IFeatureStatistics> {
        const stats = this.statistics.get(featureId);
        if (!stats) {
            return { success: false, error: 'Statistics not found' };
        }
        return { success: true, data: stats };
    }

    // ==================== FEATURE CACHING ====================

    /**
     * Cache a computed feature value
     */
    cacheFeature(key: string, featureId: string, value: number | string | boolean | number[], ttlMs?: number): void {
        const definition = this.definitions.get(featureId);
        const version = definition?.version ?? 1;

        const cached: ICachedFeature = {
            key,
            featureId,
            value,
            version,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + (ttlMs ?? this.defaultCacheTTL))
        };

        this.cache.set(key, cached);
    }

    /**
     * Get cached feature value
     */
    getCachedFeature(key: string): IServiceResult<ICachedFeature> {
        const cached = this.cache.get(key);

        if (!cached) {
            return { success: false, error: 'Not in cache' };
        }

        // Check expiration
        if (cached.expiresAt < new Date()) {
            this.cache.delete(key);
            return { success: false, error: 'Cache expired' };
        }

        // Check version
        const currentDef = this.definitions.get(cached.featureId);
        if (currentDef && currentDef.version !== cached.version) {
            this.cache.delete(key);
            return { success: false, error: 'Version mismatch' };
        }

        return { success: true, data: cached };
    }

    /**
     * Clear cache for a feature
     */
    clearCache(featureId?: string): void {
        if (featureId) {
            for (const [key, cached] of this.cache.entries()) {
                if (cached.featureId === featureId) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        logger.debug('Cache cleared', { featureId: featureId ?? 'all' });
    }

    // ==================== FEATURE VECTOR BUILDING ====================

    /**
     * Build feature vector for a model type
     */
    buildFeatureVector(
        modelType: string,
        rawFeatures: Record<string, number | string | boolean>
    ): IServiceResult<number[]> {
        const setResult = this.getActiveFeatureSet(modelType);
        if (!setResult.success) {
            return { success: false, error: setResult.error };
        }

        const featureSet = setResult.data;
        const vector: number[] = [];

        for (const featureId of featureSet.features) {
            const def = this.definitions.get(featureId);
            if (!def) {
                logger.warn('Feature not found in set', { featureId, modelType });
                vector.push(0);
                continue;
            }

            const rawValue = rawFeatures[def.name];
            if (rawValue === undefined) {
                vector.push(0);
                continue;
            }

            // Convert to number
            let numValue: number;
            if (typeof rawValue === 'boolean') {
                numValue = rawValue ? 1 : 0;
            } else if (typeof rawValue === 'string') {
                // For categorical, use index (simplified)
                numValue = rawValue.length; // Placeholder
            } else {
                numValue = rawValue;
            }

            // Apply transformations
            const transformed = this.transformFeature(featureId, numValue);
            vector.push(transformed.success ? transformed.data : numValue);
        }

        return { success: true, data: vector };
    }

    // ==================== SUMMARY ====================

    /**
     * Get store summary
     */
    getSummary(): {
        featureCount: number;
        featureSetCount: number;
        cachedCount: number;
        statisticsCount: number;
    } {
        return {
            featureCount: this.definitions.size,
            featureSetCount: this.featureSets.size,
            cachedCount: this.cache.size,
            statisticsCount: this.statistics.size
        };
    }
}
