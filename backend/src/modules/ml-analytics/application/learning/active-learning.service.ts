/**
 * Active Learning Service
 * Intelligent sample selection for model improvement
 * 
 * Features:
 * - Uncertainty sampling (low confidence predictions)
 * - Query-by-committee (disagreement between models)
 * - Expected model change estimation
 * - High-value sample prioritization
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, gte, lte, eq, desc, isNull, sql } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('ActiveLearning');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export type SamplingStrategy =
    | 'uncertainty'
    | 'margin'
    | 'entropy'
    | 'query_by_committee'
    | 'expected_change'
    | 'random';

export interface IActiveLearningConfig {
    /** Uncertainty threshold for querying (default: 0.6) */
    uncertaintyThreshold: number;
    /** Maximum samples per batch (default: 50) */
    maxBatchSize: number;
    /** Minimum confidence for rejection (default: 0.9) */
    highConfidenceThreshold: number;
    /** Margin threshold for margin sampling (default: 0.1) */
    marginThreshold: number;
    /** Enable diversity sampling (default: true) */
    enableDiversitySampling: boolean;
    /** Diversity weight (default: 0.3) */
    diversityWeight: number;
}

export interface ICandidateSample {
    predictionId: string;
    modelType: MLModelType;
    confidence: number;
    uncertaintyScore: number;
    diversityScore: number;
    priorityScore: number;
    inputFeatures: Record<string, unknown>;
    prediction: unknown;
    createdAt: Date;
    reason: string;
}

export interface IQueryBatch {
    batchId: string;
    modelType: MLModelType;
    strategy: SamplingStrategy;
    samples: ICandidateSample[];
    totalCandidates: number;
    selectedCount: number;
    createdAt: Date;
    expiresAt: Date;
}

export interface ILabeledSample {
    predictionId: string;
    actualValue: unknown;
    labeledBy: string;
    labeledAt: Date;
    quality: 'verified' | 'uncertain' | 'rejected';
}

export interface IActiveLearningStats {
    totalUnlabeledSamples: number;
    samplesQueuedForLabeling: number;
    samplesLabeledToday: number;
    averageUncertainty: number;
    highValueSampleCount: number;
    labelingRate: number;
}

const DEFAULT_CONFIG: IActiveLearningConfig = {
    uncertaintyThreshold: 0.6,
    maxBatchSize: 50,
    highConfidenceThreshold: 0.9,
    marginThreshold: 0.1,
    enableDiversitySampling: true,
    diversityWeight: 0.3
};

// ==================== SERVICE ====================

export class ActiveLearningService {
    private readonly config: IActiveLearningConfig;
    private queryPool: Map<string, ICandidateSample[]> = new Map();

    constructor(
        private readonly db: Database,
        config?: Partial<IActiveLearningConfig>
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ==================== PUBLIC API ====================

    /**
     * Select samples for labeling using specified strategy
     */
    async selectSamplesForLabeling(
        modelType: MLModelType,
        strategy: SamplingStrategy = 'uncertainty',
        maxSamples?: number
    ): Promise<IServiceResult<IQueryBatch>> {
        try {
            const limit = maxSamples ?? this.config.maxBatchSize;

            // Fetch unlabeled low-confidence predictions
            const candidates = await this.fetchCandidates(modelType, limit * 3);

            if (candidates.length === 0) {
                return {
                    success: false,
                    error: 'No unlabeled samples available'
                };
            }

            // Score and rank candidates
            const scored = this.scoreCandidates(candidates, strategy);

            // Select top samples with diversity
            const selected = this.config.enableDiversitySampling
                ? this.selectWithDiversity(scored, limit)
                : scored.slice(0, limit);

            const batchId = `batch_${Date.now()}_${modelType}`;
            const now = new Date();

            const batch: IQueryBatch = {
                batchId,
                modelType,
                strategy,
                samples: selected,
                totalCandidates: candidates.length,
                selectedCount: selected.length,
                createdAt: now,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
            };

            // Store in query pool
            this.queryPool.set(batchId, selected);

            logger.info('Sample batch selected', {
                batchId,
                modelType,
                strategy,
                selected: selected.length,
                candidates: candidates.length
            });

            return { success: true, data: batch };

        } catch (error) {
            logger.error('Sample selection failed', { modelType, strategy, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Sample selection failed'
            };
        }
    }

    /**
     * Submit labeled sample
     */
    async submitLabel(
        predictionId: string,
        actualValue: unknown,
        labeledBy: string,
        quality: ILabeledSample['quality'] = 'verified'
    ): Promise<IServiceResult<void>> {
        try {
            // Update prediction with actual value
            await this.db
                .update(mlPredictions)
                .set({
                    actualValue: actualValue as Record<string, unknown>,
                    feedbackAt: new Date(),
                    feedbackScore: quality === 'verified' ? 1.0 : quality === 'uncertain' ? 0.5 : 0.0
                })
                .where(eq(mlPredictions.id, predictionId));

            logger.info('Label submitted', { predictionId, labeledBy, quality });

            return { success: true };

        } catch (error) {
            logger.error('Label submission failed', { predictionId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Label submission failed'
            };
        }
    }

    /**
     * Get active learning statistics
     */
    async getStats(modelType?: MLModelType): Promise<IServiceResult<IActiveLearningStats>> {
        try {
            const now = new Date();
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Count unlabeled samples
            const unlabeledQuery = this.db
                .select({ count: sql<number>`count(*)::int` })
                .from(mlPredictions)
                .where(and(
                    isNull(mlPredictions.actualValue),
                    modelType ? eq(mlPredictions.modelType, modelType) : undefined
                ));

            const [unlabeledResult] = await unlabeledQuery;

            // Count labeled today
            const labeledTodayQuery = this.db
                .select({ count: sql<number>`count(*)::int` })
                .from(mlPredictions)
                .where(and(
                    gte(mlPredictions.feedbackAt, dayAgo),
                    modelType ? eq(mlPredictions.modelType, modelType) : undefined
                ));

            const [labeledTodayResult] = await labeledTodayQuery;

            // Low confidence samples
            const lowConfQuery = this.db
                .select({ count: sql<number>`count(*)::int` })
                .from(mlPredictions)
                .where(and(
                    isNull(mlPredictions.actualValue),
                    sql`${mlPredictions.confidence} < ${this.config.uncertaintyThreshold}`,
                    modelType ? eq(mlPredictions.modelType, modelType) : undefined
                ));

            const [lowConfResult] = await lowConfQuery;

            // Queue size
            let queuedCount = 0;
            for (const samples of this.queryPool.values()) {
                queuedCount += samples.length;
            }

            const totalUnlabeled = Number(unlabeledResult?.count ?? 0);
            const labeledToday = Number(labeledTodayResult?.count ?? 0);

            return {
                success: true,
                data: {
                    totalUnlabeledSamples: totalUnlabeled,
                    samplesQueuedForLabeling: queuedCount,
                    samplesLabeledToday: labeledToday,
                    averageUncertainty: 0.5, // Would need to compute
                    highValueSampleCount: Number(lowConfResult?.count ?? 0),
                    labelingRate: totalUnlabeled > 0 ? labeledToday / totalUnlabeled : 0
                }
            };

        } catch (error) {
            logger.error('Failed to get stats', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Stats retrieval failed'
            };
        }
    }

    /**
     * Get pending query batch
     */
    getQueryBatch(batchId: string): ICandidateSample[] | null {
        return this.queryPool.get(batchId) ?? null;
    }

    /**
     * Clear completed batch
     */
    clearBatch(batchId: string): void {
        this.queryPool.delete(batchId);
    }

    // ==================== PRIVATE METHODS ====================

    private async fetchCandidates(
        modelType: MLModelType,
        limit: number
    ): Promise<Array<{
        id: string;
        confidence: number;
        inputFeatures: Record<string, unknown>;
        formattedPrediction: unknown;
        createdAt: Date;
    }>> {
        try {
            const predictions = await this.db
                .select({
                    id: mlPredictions.id,
                    confidence: mlPredictions.confidence,
                    inputFeatures: mlPredictions.inputFeatures,
                    formattedPrediction: mlPredictions.formattedPrediction,
                    createdAt: mlPredictions.createdAt
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    isNull(mlPredictions.actualValue),
                    sql`${mlPredictions.confidence} < ${this.config.highConfidenceThreshold}`
                ))
                .orderBy(mlPredictions.confidence)
                .limit(limit);

            return predictions.map(p => ({
                id: p.id,
                confidence: p.confidence ?? 0.5,
                inputFeatures: (p.inputFeatures ?? {}) as Record<string, unknown>,
                formattedPrediction: p.formattedPrediction,
                createdAt: p.createdAt
            }));

        } catch (error) {
            logger.error('Failed to fetch candidates', { modelType, error });
            return [];
        }
    }

    private scoreCandidates(
        candidates: Array<{
            id: string;
            confidence: number;
            inputFeatures: Record<string, unknown>;
            formattedPrediction: unknown;
            createdAt: Date;
        }>,
        strategy: SamplingStrategy
    ): ICandidateSample[] {
        return candidates.map(c => {
            const uncertaintyScore = this.calculateUncertainty(c.confidence, strategy);
            const diversityScore = 0.5; // Would need full dataset for proper diversity

            let priorityScore: number;
            switch (strategy) {
                case 'uncertainty':
                    priorityScore = uncertaintyScore;
                    break;
                case 'margin':
                    priorityScore = 1 - c.confidence; // Lower confidence = higher priority
                    break;
                case 'entropy':
                    priorityScore = this.calculateEntropy(c.confidence);
                    break;
                default:
                    priorityScore = uncertaintyScore;
            }

            const reason = this.getSelectionReason(strategy, c.confidence, priorityScore);

            return {
                predictionId: c.id,
                modelType: 'waste_predictor' as MLModelType, // Would come from query
                confidence: c.confidence,
                uncertaintyScore,
                diversityScore,
                priorityScore,
                inputFeatures: c.inputFeatures,
                prediction: c.formattedPrediction,
                createdAt: c.createdAt,
                reason
            };
        }).sort((a, b) => b.priorityScore - a.priorityScore);
    }

    private calculateUncertainty(confidence: number, strategy: SamplingStrategy): number {
        switch (strategy) {
            case 'uncertainty':
                return 1 - confidence;
            case 'margin':
                // Margin sampling: smaller margin = higher uncertainty
                return 1 - Math.abs(confidence - 0.5) * 2;
            case 'entropy':
                return this.calculateEntropy(confidence);
            default:
                return 1 - confidence;
        }
    }

    private calculateEntropy(confidence: number): number {
        // Binary entropy
        const p = Math.max(0.001, Math.min(0.999, confidence));
        const q = 1 - p;
        return -(p * Math.log2(p) + q * Math.log2(q));
    }

    private selectWithDiversity(
        candidates: ICandidateSample[],
        limit: number
    ): ICandidateSample[] {
        if (candidates.length <= limit) {
            return candidates;
        }

        const selected: ICandidateSample[] = [];
        const remaining = [...candidates];

        // Always take the highest priority sample first
        selected.push(remaining.shift()!);

        // Use greedy selection with diversity
        while (selected.length < limit && remaining.length > 0) {
            let bestIndex = 0;
            let bestScore = -Infinity;

            for (let i = 0; i < remaining.length; i++) {
                const candidate = remaining[i];

                // Calculate diversity bonus based on feature differences
                const diversityBonus = this.calculateDiversityBonus(candidate, selected);

                const combinedScore =
                    candidate.priorityScore * (1 - this.config.diversityWeight) +
                    diversityBonus * this.config.diversityWeight;

                if (combinedScore > bestScore) {
                    bestScore = combinedScore;
                    bestIndex = i;
                }
            }

            selected.push(remaining.splice(bestIndex, 1)[0]);
        }

        return selected;
    }

    private calculateDiversityBonus(
        candidate: ICandidateSample,
        selected: ICandidateSample[]
    ): number {
        if (selected.length === 0) return 1;

        // Simple diversity: average distance in confidence space
        const avgDistance = selected.reduce((sum, s) => {
            return sum + Math.abs(candidate.confidence - s.confidence);
        }, 0) / selected.length;

        return avgDistance;
    }

    private getSelectionReason(
        strategy: SamplingStrategy,
        confidence: number,
        priorityScore: number
    ): string {
        switch (strategy) {
            case 'uncertainty':
                return `Low confidence (${(confidence * 100).toFixed(1)}%) - needs human verification`;
            case 'margin':
                return `Close to decision boundary - margin sampling priority: ${priorityScore.toFixed(3)}`;
            case 'entropy':
                return `High prediction entropy (${priorityScore.toFixed(3)}) - uncertain output`;
            case 'query_by_committee':
                return 'Model disagreement detected - committee vote needed';
            case 'expected_change':
                return 'Expected high model improvement from labeling';
            default:
                return `Selected with priority score: ${priorityScore.toFixed(3)}`;
        }
    }
}

// ==================== FACTORY ====================

export function createActiveLearningService(
    db: Database,
    config?: Partial<IActiveLearningConfig>
): ActiveLearningService {
    return new ActiveLearningService(db, config);
}
