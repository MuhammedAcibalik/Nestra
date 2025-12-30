/**
 * Explanation Service
 * Provides model interpretation using SHAP and other XAI techniques
 * 
 * Features:
 * - Local explanations (single prediction)
 * - Global feature importance
 * - Top contributors (positive/negative)
 * - Caching for repeated requests
 */

import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult, ILocalExplanation, MLModelType } from '../../domain';
import { PythonBridgeService } from '../../infrastructure/python/python-bridge.service';
import path from 'path';

const logger = createModuleLogger('ExplanationService');

// ==================== TYPES ====================

export interface IFeatureContribution {
    feature: string;
    contribution: number;
    value?: number;
}

export interface IFeatureImportance {
    feature: string;
    importance: number;
    value: number;
}

export interface IExplanationResult {
    /** Model type explained */
    modelType: MLModelType;
    /** Model version */
    modelVersion: string;
    /** Original prediction value */
    prediction: number;
    /** Base/expected value */
    expectedValue: number;
    /** SHAP values for each feature */
    shapValues: number[];
    /** Feature names in order */
    featureNames: string[];
    /** Sorted feature importance */
    featureImportance: IFeatureImportance[];
    /** Top positive and negative contributors */
    topContributors: {
        positive: IFeatureContribution[];
        negative: IFeatureContribution[];
    };
    /** Whether mock explanation was used */
    isMock?: boolean;
    /** Explanation generation time in ms */
    generationTimeMs: number;
}

export interface IExplanationConfig {
    /** Path to background data CSV for SHAP */
    backgroundDataPath?: string;
    /** Cache explanations for this many ms */
    cacheTtlMs?: number;
    /** Timeout for Python script */
    timeoutMs?: number;
}

const DEFAULT_CONFIG: IExplanationConfig = {
    cacheTtlMs: 60000, // 1 minute cache
    timeoutMs: 30000   // 30 second timeout
};

// ==================== SERVICE ====================

export class ExplanationService {
    private readonly pythonBridge: PythonBridgeService;
    private readonly modelsDir: string;
    private readonly cache: Map<string, { result: IExplanationResult; expiresAt: number }>;
    private readonly config: IExplanationConfig;

    constructor(config?: IExplanationConfig) {
        this.pythonBridge = new PythonBridgeService();
        this.modelsDir = path.join(process.cwd(), 'models', 'onnx');
        this.cache = new Map();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ==================== PUBLIC API ====================

    /**
     * Generate local explanation for a prediction
     */
    async explainPrediction(
        modelType: MLModelType,
        inputFeatures: Record<string, number>,
        modelVersion?: string
    ): Promise<IServiceResult<IExplanationResult>> {
        const startTime = Date.now();

        try {
            // Check cache
            const cacheKey = this.buildCacheKey(modelType, inputFeatures);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.debug('Returning cached explanation', { modelType });
                return { success: true, data: cached };
            }

            // Build model path
            const modelPath = this.getModelPath(modelType, modelVersion);

            // Call Python bridge
            const result = await this.pythonBridge.generateExplanation(
                modelType,
                modelPath,
                inputFeatures,
                this.config.backgroundDataPath
            );

            if (!result.success || !result.data) {
                return { success: false, error: result.error ?? 'Explanation generation failed' };
            }

            // Transform to our format
            const explanation = this.transformExplanation(
                result.data,
                modelType,
                modelVersion ?? '1.0.0',
                Date.now() - startTime
            );

            // Cache result
            this.setCache(cacheKey, explanation);

            logger.info('Generated explanation', {
                modelType,
                isMock: explanation.isMock,
                generationTimeMs: explanation.generationTimeMs
            });

            return { success: true, data: explanation };

        } catch (error) {
            logger.error('Explanation failed', { error, modelType });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Explanation failed'
            };
        }
    }

    /**
     * Get global feature importance across all predictions
     * (Requires background data with actual predictions)
     */
    async getGlobalImportance(
        modelType: MLModelType
    ): Promise<IServiceResult<IFeatureImportance[]>> {
        // This would aggregate multiple explanations
        // For now, return a placeholder
        logger.warn('Global importance not yet implemented, returning mock');

        return {
            success: true,
            data: [
                { feature: 'totalPieceCount', importance: 0.25, value: 0 },
                { feature: 'avgPieceArea', importance: 0.20, value: 0 },
                { feature: 'pieceAreaStdDev', importance: 0.15, value: 0 },
                { feature: 'kerf', importance: 0.12, value: 0 },
                { feature: 'totalStockArea', importance: 0.10, value: 0 }
            ]
        };
    }

    /**
     * Clear explanation cache
     */
    clearCache(): void {
        this.cache.clear();
        logger.info('Explanation cache cleared');
    }

    // ==================== INTERNAL METHODS ====================

    private getModelPath(modelType: MLModelType, version?: string): string {
        const modelFile = version
            ? `${modelType}_v${version}.onnx`
            : `${modelType}.onnx`;
        return path.join(this.modelsDir, modelFile);
    }

    private transformExplanation(
        raw: ILocalExplanation,
        modelType: MLModelType,
        modelVersion: string,
        generationTimeMs: number
    ): IExplanationResult {
        // Python script may return extended fields beyond ILocalExplanation
        // Use type assertion for extended fields
        const extended = raw as ILocalExplanation & {
            expectedValue?: number;
            shapValues?: number[];
            featureNames?: string[];
            featureImportance?: IFeatureImportance[];
            topContributors?: { positive: IFeatureContribution[]; negative: IFeatureContribution[] };
            isMock?: boolean;
        };

        return {
            modelType,
            modelVersion,
            prediction: raw.prediction ?? 0,
            expectedValue: extended.expectedValue ?? raw.baseline ?? 0,
            shapValues: extended.shapValues ?? Object.values(raw.contributions),
            featureNames: extended.featureNames ?? Object.keys(raw.contributions),
            featureImportance: extended.featureImportance ?? this.buildImportanceFromContributions(raw.contributions),
            topContributors: extended.topContributors ?? this.buildTopContributors(raw.contributions),
            isMock: extended.isMock ?? false,
            generationTimeMs
        };
    }

    private buildTopContributors(contributions: Record<string, number>): {
        positive: IFeatureContribution[];
        negative: IFeatureContribution[];
    } {
        const sorted = Object.entries(contributions)
            .map(([feature, contribution]) => ({ feature, contribution }))
            .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

        return {
            positive: sorted.filter(c => c.contribution > 0).slice(0, 5),
            negative: sorted.filter(c => c.contribution < 0).slice(0, 5)
        };
    }

    private buildImportanceFromContributions(
        contributions: Record<string, number> | undefined
    ): IFeatureImportance[] {
        if (!contributions) return [];

        return Object.entries(contributions)
            .map(([feature, contrib]) => ({
                feature,
                importance: Math.abs(contrib),
                value: contrib
            }))
            .sort((a, b) => b.importance - a.importance);
    }

    private buildCacheKey(modelType: string, features: Record<string, number>): string {
        const featureStr = Object.entries(features)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v.toFixed(4)}`)
            .join('|');
        return `${modelType}:${featureStr}`;
    }

    private getFromCache(key: string): IExplanationResult | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.result;
    }

    private setCache(key: string, result: IExplanationResult): void {
        this.cache.set(key, {
            result,
            expiresAt: Date.now() + (this.config.cacheTtlMs ?? 60000)
        });
    }
}

// ==================== FACTORY ====================

let explanationServiceInstance: ExplanationService | null = null;

export function getExplanationService(config?: IExplanationConfig): ExplanationService {
    if (!explanationServiceInstance) {
        explanationServiceInstance = new ExplanationService(config);
    }
    return explanationServiceInstance;
}
