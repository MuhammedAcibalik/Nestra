/**
 * Explainability Service (XAI)
 * Provides model-agnostic explanations for ML predictions
 */

import { createModuleLogger } from '../../../../core/logger';

const logger = createModuleLogger('ExplainabilityService');

// ==================== TYPES ====================

type IServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export interface IFeatureImportance {
    featureName: string;
    importance: number;          // 0-1 normalized importance
    contribution: number;        // Raw contribution to prediction
    direction: 'positive' | 'negative' | 'neutral';
    description?: string;
}

export interface IPredictionExplanation {
    predictionType: string;
    predictedValue: number | string;
    confidence: number;
    baseValue: number;                        // Expected value without features
    topContributors: IFeatureImportance[];    // Top features pushing prediction up
    topDetractors: IFeatureImportance[];      // Top features pushing prediction down
    featureBreakdown: IFeatureImportance[];   // All features sorted by importance
    summary: string;                          // Human-readable explanation
    timestamp: Date;
}

export interface IContrastiveExplanation {
    actualPrediction: number | string;
    counterfactualPrediction: number | string;
    changedFeatures: Array<{
        featureName: string;
        originalValue: number;
        counterfactualValue: number;
        impact: number;
    }>;
    explanation: string;
}

export interface IFeatureInteraction {
    feature1: string;
    feature2: string;
    interactionStrength: number;
    synergy: 'positive' | 'negative' | 'none';
    description: string;
}

// ==================== SERVICE ====================

export class ExplainabilityService {
    // Feature metadata for explanations
    private featureDescriptions: Map<string, string> = new Map();
    private featureRanges: Map<string, { min: number; max: number; typical: number }> = new Map();

    constructor() {
        this.initializeFeatureMetadata();
    }

    private initializeFeatureMetadata(): void {
        // Initialize descriptions for common features
        this.featureDescriptions.set('piece_count', 'Number of pieces to cut');
        this.featureDescriptions.set('total_piece_area', 'Total area of all pieces');
        this.featureDescriptions.set('avg_piece_area', 'Average area per piece');
        this.featureDescriptions.set('piece_area_variance', 'Variation in piece sizes');
        this.featureDescriptions.set('stock_count', 'Number of available stock sheets');
        this.featureDescriptions.set('total_stock_area', 'Total available cutting area');
        this.featureDescriptions.set('area_ratio', 'Ratio of piece area to stock area');
        this.featureDescriptions.set('kerf_width', 'Width of cutting blade');
        this.featureDescriptions.set('allow_rotation', 'Whether rotation is allowed');
        this.featureDescriptions.set('material_type', 'Type of material being cut');
        this.featureDescriptions.set('thickness', 'Material thickness');
        this.featureDescriptions.set('historical_avg_waste', 'Historical average waste');
        this.featureDescriptions.set('complexity_score', 'Job complexity metric');
        this.featureDescriptions.set('uniqueness_ratio', 'Ratio of unique pieces');

        // Initialize typical ranges
        this.featureRanges.set('piece_count', { min: 1, max: 1000, typical: 50 });
        this.featureRanges.set('area_ratio', { min: 0.1, max: 1.5, typical: 0.7 });
        this.featureRanges.set('kerf_width', { min: 1, max: 10, typical: 3 });
        this.featureRanges.set('thickness', { min: 1, max: 50, typical: 18 });
        this.featureRanges.set('historical_avg_waste', { min: 0, max: 50, typical: 15 });
    }

    // ==================== FEATURE IMPORTANCE ====================

    /**
     * Calculate feature importance using permutation importance
     * (Simplified version - actual would permute and re-predict)
     */
    calculateFeatureImportance(
        features: Record<string, number>,
        prediction: number,
        baseValue: number
    ): IServiceResult<IFeatureImportance[]> {
        try {
            const importances: IFeatureImportance[] = [];
            const predictionDelta = prediction - baseValue;

            // Calculate importance based on feature deviation from typical
            for (const [name, value] of Object.entries(features)) {
                const range = this.featureRanges.get(name);
                const description = this.featureDescriptions.get(name);

                let normalizedDeviation = 0;
                if (range) {
                    const rangeSize = range.max - range.min;
                    normalizedDeviation = rangeSize > 0
                        ? (value - range.typical) / rangeSize
                        : 0;
                }

                // Estimate contribution (simplified - real would use SHAP)
                const contribution = normalizedDeviation * (predictionDelta / Object.keys(features).length);
                const importance = Math.abs(normalizedDeviation);

                importances.push({
                    featureName: name,
                    importance: Math.min(importance, 1),
                    contribution,
                    direction: contribution > 0.01 ? 'positive' : contribution < -0.01 ? 'negative' : 'neutral',
                    description
                });
            }

            // Sort by importance
            importances.sort((a, b) => b.importance - a.importance);

            return { success: true, data: importances };
        } catch (error) {
            logger.error('Failed to calculate feature importance', { error });
            return { success: false, error: 'Failed to calculate importance' };
        }
    }

    /**
     * Calculate SHAP-like values (simplified approximation)
     */
    calculateShapValues(
        features: Record<string, number>,
        prediction: number,
        baseValue: number
    ): IServiceResult<Record<string, number>> {
        try {
            const shapValues: Record<string, number> = {};
            const featureNames = Object.keys(features);
            const totalContribution = prediction - baseValue;

            // Distribute contribution based on feature deviations
            const deviations: Record<string, number> = {};
            let totalDeviation = 0;

            for (const name of featureNames) {
                const value = features[name];
                const range = this.featureRanges.get(name);

                let deviation = Math.abs(value);
                if (range) {
                    deviation = Math.abs(value - range.typical);
                }

                deviations[name] = deviation;
                totalDeviation += deviation;
            }

            // Assign SHAP values proportionally
            for (const name of featureNames) {
                if (totalDeviation > 0) {
                    shapValues[name] = (deviations[name] / totalDeviation) * totalContribution;
                } else {
                    shapValues[name] = totalContribution / featureNames.length;
                }
            }

            return { success: true, data: shapValues };
        } catch (error) {
            logger.error('Failed to calculate SHAP values', { error });
            return { success: false, error: 'Failed to calculate SHAP values' };
        }
    }

    // ==================== PREDICTION EXPLANATIONS ====================

    /**
     * Generate comprehensive explanation for a prediction
     */
    explainPrediction(
        predictionType: string,
        predictedValue: number,
        confidence: number,
        features: Record<string, number>,
        baseValue?: number
    ): IServiceResult<IPredictionExplanation> {
        try {
            const base = baseValue ?? this.getDefaultBaseValue(predictionType);

            // Calculate importance
            const importanceResult = this.calculateFeatureImportance(features, predictedValue, base);
            if (!importanceResult.success) {
                return { success: false, error: importanceResult.error };
            }

            const featureBreakdown = importanceResult.data;

            // Separate contributors and detractors
            const topContributors = featureBreakdown
                .filter(f => f.direction === 'positive')
                .slice(0, 3);

            const topDetractors = featureBreakdown
                .filter(f => f.direction === 'negative')
                .slice(0, 3);

            // Generate summary
            const summary = this.generateSummary(predictionType, predictedValue, topContributors, topDetractors);

            const explanation: IPredictionExplanation = {
                predictionType,
                predictedValue,
                confidence,
                baseValue: base,
                topContributors,
                topDetractors,
                featureBreakdown,
                summary,
                timestamp: new Date()
            };

            return { success: true, data: explanation };
        } catch (error) {
            logger.error('Failed to explain prediction', { error });
            return { success: false, error: 'Failed to explain prediction' };
        }
    }

    private getDefaultBaseValue(predictionType: string): number {
        switch (predictionType) {
            case 'waste_prediction':
                return 15; // 15% typical waste
            case 'time_estimation':
                return 60; // 60 minutes typical
            case 'anomaly_score':
                return 0.5; // Neutral anomaly score
            default:
                return 0;
        }
    }

    private generateSummary(
        predictionType: string,
        predictedValue: number,
        contributors: IFeatureImportance[],
        detractors: IFeatureImportance[]
    ): string {
        let summary = '';

        switch (predictionType) {
            case 'waste_prediction':
                summary = `Predicted waste: ${predictedValue.toFixed(1)}%. `;
                if (contributors.length > 0) {
                    const topContrib = contributors[0];
                    summary += `${topContrib.description || topContrib.featureName} is the main factor increasing waste. `;
                }
                if (detractors.length > 0) {
                    const topDetract = detractors[0];
                    summary += `${topDetract.description || topDetract.featureName} helps reduce waste.`;
                }
                break;

            case 'time_estimation':
                summary = `Estimated time: ${predictedValue.toFixed(0)} minutes. `;
                if (contributors.length > 0) {
                    summary += `Time is primarily affected by ${contributors[0].featureName}.`;
                }
                break;

            case 'algorithm_selection':
                summary = `Recommended algorithm selected based on job characteristics. `;
                if (contributors.length > 0) {
                    summary += `Key factor: ${contributors[0].featureName}.`;
                }
                break;

            default:
                summary = `Prediction: ${predictedValue}`;
        }

        return summary;
    }

    // ==================== CONTRASTIVE EXPLANATIONS ====================

    /**
     * Generate "what-if" contrastive explanation
     */
    generateContrastiveExplanation(
        originalFeatures: Record<string, number>,
        modifiedFeatures: Record<string, number>,
        originalPrediction: number,
        modifiedPrediction: number
    ): IServiceResult<IContrastiveExplanation> {
        try {
            const changedFeatures: IContrastiveExplanation['changedFeatures'] = [];

            for (const [name, originalValue] of Object.entries(originalFeatures)) {
                const modifiedValue = modifiedFeatures[name];
                if (modifiedValue !== undefined && modifiedValue !== originalValue) {
                    const impact = (modifiedPrediction - originalPrediction) *
                        (Math.abs(modifiedValue - originalValue) /
                            Object.keys(originalFeatures).length);

                    changedFeatures.push({
                        featureName: name,
                        originalValue,
                        counterfactualValue: modifiedValue,
                        impact
                    });
                }
            }

            // Sort by impact
            changedFeatures.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

            // Generate explanation
            let explanation = `Changing `;
            if (changedFeatures.length > 0) {
                const top = changedFeatures[0];
                explanation += `${top.featureName} from ${top.originalValue.toFixed(2)} to ${top.counterfactualValue.toFixed(2)} `;
                explanation += `would change the prediction from ${originalPrediction.toFixed(2)} to ${modifiedPrediction.toFixed(2)}.`;
            }

            return {
                success: true,
                data: {
                    actualPrediction: originalPrediction,
                    counterfactualPrediction: modifiedPrediction,
                    changedFeatures,
                    explanation
                }
            };
        } catch (error) {
            logger.error('Failed to generate contrastive explanation', { error });
            return { success: false, error: 'Failed to generate contrastive explanation' };
        }
    }

    // ==================== FEATURE INTERACTIONS ====================

    /**
     * Detect feature interactions (simplified)
     */
    detectFeatureInteractions(
        features: Record<string, number>
    ): IServiceResult<IFeatureInteraction[]> {
        try {
            const interactions: IFeatureInteraction[] = [];
            const featureNames = Object.keys(features);

            // Check known interaction patterns
            const knownInteractions: Array<{
                f1: string;
                f2: string;
                synergy: 'positive' | 'negative';
                desc: string;
            }> = [
                    {
                        f1: 'piece_count',
                        f2: 'piece_area_variance',
                        synergy: 'negative',
                        desc: 'High piece count with high variance increases complexity'
                    },
                    {
                        f1: 'area_ratio',
                        f2: 'allow_rotation',
                        synergy: 'positive',
                        desc: 'Rotation helps when area ratio is tight'
                    },
                    {
                        f1: 'thickness',
                        f2: 'kerf_width',
                        synergy: 'negative',
                        desc: 'Thicker material with wider kerf increases waste'
                    },
                    {
                        f1: 'stock_count',
                        f2: 'piece_count',
                        synergy: 'positive',
                        desc: 'More stock options help with more pieces'
                    }
                ];

            for (const known of knownInteractions) {
                if (featureNames.includes(known.f1) && featureNames.includes(known.f2)) {
                    const val1 = features[known.f1];
                    const val2 = features[known.f2];

                    // Calculate interaction strength based on both values being significant
                    const strength = Math.min(
                        Math.abs(val1) / (this.featureRanges.get(known.f1)?.max ?? 100),
                        Math.abs(val2) / (this.featureRanges.get(known.f2)?.max ?? 100)
                    );

                    if (strength > 0.1) {
                        interactions.push({
                            feature1: known.f1,
                            feature2: known.f2,
                            interactionStrength: strength,
                            synergy: known.synergy,
                            description: known.desc
                        });
                    }
                }
            }

            return { success: true, data: interactions };
        } catch (error) {
            logger.error('Failed to detect feature interactions', { error });
            return { success: false, error: 'Failed to detect interactions' };
        }
    }

    // ==================== UTILITIES ====================

    /**
     * Add custom feature description
     */
    addFeatureDescription(name: string, description: string): void {
        this.featureDescriptions.set(name, description);
    }

    /**
     * Add feature range for importance calculation
     */
    addFeatureRange(name: string, min: number, max: number, typical: number): void {
        this.featureRanges.set(name, { min, max, typical });
    }

    /**
     * Get all feature descriptions
     */
    getFeatureDescriptions(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [name, desc] of this.featureDescriptions) {
            result[name] = desc;
        }
        return result;
    }
}
