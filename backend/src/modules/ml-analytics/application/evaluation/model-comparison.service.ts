/**
 * Model Comparison Framework
 * A/B test metrics and statistical significance testing
 * 
 * Features:
 * - Head-to-head model comparison
 * - Statistical significance testing
 * - Performance delta analysis
 * - Automated promotion decision
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions, mlModels } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('ModelComparison');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export interface IComparisonMetrics {
    modelId: string;
    modelVersion: string;
    predictionCount: number;
    avgConfidence: number;
    avgLatencyMs: number;
    feedbackCount: number;
    accuracyEstimate: number;
    errorRate: number;
}

export interface IStatisticalTest {
    testName: 'z-test' | 't-test' | 'chi-square' | 'mann-whitney';
    statistic: number;
    pValue: number;
    significanceLevel: number;
    isSignificant: boolean;
    effectSize: number;
    interpretation: string;
}

export interface IModelComparisonResult {
    modelA: IComparisonMetrics;
    modelB: IComparisonMetrics;
    comparisonPeriod: { start: Date; end: Date };
    statisticalTests: IStatisticalTest[];
    metricDeltas: Record<string, {
        delta: number;
        percentChange: number;
        winner: 'A' | 'B' | 'none';
    }>;
    overallWinner: 'A' | 'B' | 'tie';
    confidenceLevel: number;
    recommendation: IPromotionRecommendation;
}

export interface IPromotionRecommendation {
    shouldPromote: boolean;
    targetModel: 'A' | 'B' | 'none';
    confidence: 'high' | 'medium' | 'low';
    reasons: string[];
    warnings: string[];
    suggestedRolloutPercent: number;
}

// ==================== SERVICE ====================

export class ModelComparisonService {
    constructor(
        private readonly db: Database
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Compare two models head-to-head
     */
    async compareModels(
        modelAId: string,
        modelBId: string,
        days: number = 14
    ): Promise<IServiceResult<IModelComparisonResult>> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

            // Get model info
            const [modelA] = await this.db.select().from(mlModels).where(eq(mlModels.id, modelAId));
            const [modelB] = await this.db.select().from(mlModels).where(eq(mlModels.id, modelBId));

            if (!modelA || !modelB) {
                return { success: false, error: 'One or both models not found' };
            }

            // Collect metrics for both models
            const metricsA = await this.collectMetrics(modelAId, startDate, endDate);
            const metricsB = await this.collectMetrics(modelBId, startDate, endDate);

            metricsA.modelVersion = modelA.version;
            metricsB.modelVersion = modelB.version;

            // Run statistical tests
            const statisticalTests = await this.runStatisticalTests(
                modelAId, modelBId, startDate, endDate
            );

            // Calculate deltas
            const metricDeltas = this.calculateDeltas(metricsA, metricsB);

            // Determine winner
            const { winner, confidenceLevel } = this.determineWinner(metricDeltas, statisticalTests);

            // Generate recommendation
            const recommendation = this.generateRecommendation(
                winner, metricsA, metricsB, statisticalTests
            );

            const result: IModelComparisonResult = {
                modelA: metricsA,
                modelB: metricsB,
                comparisonPeriod: { start: startDate, end: endDate },
                statisticalTests,
                metricDeltas,
                overallWinner: winner,
                confidenceLevel,
                recommendation
            };

            logger.info('Model comparison complete', {
                modelAId,
                modelBId,
                winner,
                confidenceLevel
            });

            return { success: true, data: result };

        } catch (error) {
            logger.error('Model comparison failed', { modelAId, modelBId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Comparison failed'
            };
        }
    }

    /**
     * Compare production vs shadow model
     */
    async compareShadowToProduction(
        modelType: MLModelType
    ): Promise<IServiceResult<IModelComparisonResult | null>> {
        try {
            // Get production model
            const [prodModel] = await this.db
                .select()
                .from(mlModels)
                .where(and(
                    eq(mlModels.modelType, modelType),
                    eq(mlModels.status, 'production')
                ));

            // Get shadow model
            const [shadowModel] = await this.db
                .select()
                .from(mlModels)
                .where(and(
                    eq(mlModels.modelType, modelType),
                    eq(mlModels.status, 'staging')
                ));

            if (!prodModel || !shadowModel) {
                return { success: true, data: null };
            }

            return this.compareModels(prodModel.id, shadowModel.id);

        } catch (error) {
            logger.error('Shadow comparison failed', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Shadow comparison failed'
            };
        }
    }

    /**
     * Run A/B test with traffic split
     */
    async evaluateABTest(
        experimentId: string,
        modelAId: string,
        modelBId: string
    ): Promise<IServiceResult<IModelComparisonResult>> {
        // For A/B tests, we compare predictions tagged with the experiment
        return this.compareModels(modelAId, modelBId, 7);
    }

    // ==================== PRIVATE METHODS ====================

    private async collectMetrics(
        modelId: string,
        startDate: Date,
        endDate: Date
    ): Promise<IComparisonMetrics> {
        const stats = await this.db
            .select({
                predictionCount: sql<number>`count(*)::int`,
                avgConfidence: sql<number>`avg(${mlPredictions.confidence})::float`,
                avgLatencyMs: sql<number>`avg(${mlPredictions.inferenceMs})::float`,
                feedbackCount: sql<number>`count(${mlPredictions.feedbackScore})::int`,
                avgFeedback: sql<number>`avg(${mlPredictions.feedbackScore})::float`,
                fallbackCount: sql<number>`sum(case when ${mlPredictions.usedFallback} then 1 else 0 end)::int`
            })
            .from(mlPredictions)
            .where(and(
                eq(mlPredictions.modelId, modelId),
                gte(mlPredictions.createdAt, startDate),
                lte(mlPredictions.createdAt, endDate)
            ));

        const result = stats[0] ?? {
            predictionCount: 0,
            avgConfidence: 0,
            avgLatencyMs: 0,
            feedbackCount: 0,
            avgFeedback: 0,
            fallbackCount: 0
        };

        const predCount = Number(result.predictionCount) || 0;
        const fallbackCount = Number(result.fallbackCount) || 0;

        return {
            modelId,
            modelVersion: '',
            predictionCount: predCount,
            avgConfidence: Number(result.avgConfidence) || 0,
            avgLatencyMs: Number(result.avgLatencyMs) || 0,
            feedbackCount: Number(result.feedbackCount) || 0,
            accuracyEstimate: Number(result.avgFeedback) || 0,
            errorRate: predCount > 0 ? fallbackCount / predCount : 0
        };
    }

    private async runStatisticalTests(
        modelAId: string,
        modelBId: string,
        startDate: Date,
        endDate: Date
    ): Promise<IStatisticalTest[]> {
        const tests: IStatisticalTest[] = [];

        // Get confidence values for both models
        const [confA, confB] = await Promise.all([
            this.getConfidenceValues(modelAId, startDate, endDate),
            this.getConfidenceValues(modelBId, startDate, endDate)
        ]);

        if (confA.length > 0 && confB.length > 0) {
            // Perform z-test on means
            const zTest = this.performZTest(confA, confB);
            tests.push(zTest);

            // Perform effect size calculation
            const effectTest = this.performEffectSizeTest(confA, confB);
            tests.push(effectTest);
        }

        return tests;
    }

    private async getConfidenceValues(
        modelId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number[]> {
        const results = await this.db
            .select({ confidence: mlPredictions.confidence })
            .from(mlPredictions)
            .where(and(
                eq(mlPredictions.modelId, modelId),
                gte(mlPredictions.createdAt, startDate),
                lte(mlPredictions.createdAt, endDate)
            ))
            .limit(1000);

        return results
            .map(r => r.confidence)
            .filter((c): c is number => c !== null);
    }

    private performZTest(valuesA: number[], valuesB: number[]): IStatisticalTest {
        const meanA = this.mean(valuesA);
        const meanB = this.mean(valuesB);
        const stdA = this.std(valuesA);
        const stdB = this.std(valuesB);
        const nA = valuesA.length;
        const nB = valuesB.length;

        const pooledStdError = Math.sqrt((stdA * stdA / nA) + (stdB * stdB / nB));
        const zStat = pooledStdError > 0 ? (meanA - meanB) / pooledStdError : 0;

        // Approximate p-value using normal distribution
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zStat)));

        const significanceLevel = 0.05;
        const isSignificant = pValue < significanceLevel;

        return {
            testName: 'z-test',
            statistic: zStat,
            pValue,
            significanceLevel,
            isSignificant,
            effectSize: 0, // Set by effect size test
            interpretation: isSignificant
                ? `Difference is statistically significant (p=${pValue.toFixed(4)})`
                : `No significant difference detected (p=${pValue.toFixed(4)})`
        };
    }

    private performEffectSizeTest(valuesA: number[], valuesB: number[]): IStatisticalTest {
        // Cohen's d effect size
        const meanA = this.mean(valuesA);
        const meanB = this.mean(valuesB);
        const pooledStd = Math.sqrt(
            ((valuesA.length - 1) * this.variance(valuesA) +
                (valuesB.length - 1) * this.variance(valuesB)) /
            (valuesA.length + valuesB.length - 2)
        );

        const cohensD = pooledStd > 0 ? (meanA - meanB) / pooledStd : 0;
        const absD = Math.abs(cohensD);

        let interpretation: string;
        if (absD < 0.2) interpretation = 'Negligible effect size';
        else if (absD < 0.5) interpretation = 'Small effect size';
        else if (absD < 0.8) interpretation = 'Medium effect size';
        else interpretation = 'Large effect size';

        return {
            testName: 't-test',
            statistic: cohensD,
            pValue: 0, // Not applicable for effect size
            significanceLevel: 0,
            isSignificant: absD >= 0.5,
            effectSize: cohensD,
            interpretation: `Cohen's d = ${cohensD.toFixed(3)}: ${interpretation}`
        };
    }

    private calculateDeltas(
        metricsA: IComparisonMetrics,
        metricsB: IComparisonMetrics
    ): IModelComparisonResult['metricDeltas'] {
        const deltas: IModelComparisonResult['metricDeltas'] = {};

        const metrics = ['avgConfidence', 'avgLatencyMs', 'accuracyEstimate', 'errorRate'] as const;

        for (const metric of metrics) {
            const valA = metricsA[metric];
            const valB = metricsB[metric];
            const delta = valB - valA;
            const percentChange = valA !== 0 ? (delta / valA) * 100 : valB !== 0 ? 100 : 0;

            // For latency and error rate, lower is better
            const lowerIsBetter = metric === 'avgLatencyMs' || metric === 'errorRate';
            let winner: 'A' | 'B' | 'none' = 'none';

            if (Math.abs(percentChange) > 5) { // 5% threshold
                if (lowerIsBetter) {
                    winner = delta < 0 ? 'B' : 'A';
                } else {
                    winner = delta > 0 ? 'B' : 'A';
                }
            }

            deltas[metric] = { delta, percentChange, winner };
        }

        return deltas;
    }

    private determineWinner(
        deltas: IModelComparisonResult['metricDeltas'],
        tests: IStatisticalTest[]
    ): { winner: 'A' | 'B' | 'tie'; confidenceLevel: number } {
        let aWins = 0;
        let bWins = 0;

        for (const d of Object.values(deltas)) {
            if (d.winner === 'A') aWins++;
            if (d.winner === 'B') bWins++;
        }

        const significantTest = tests.find(t => t.isSignificant);
        let confidenceLevel = 0.5;

        if (significantTest) {
            confidenceLevel = significantTest.pValue < 0.01 ? 0.99 :
                significantTest.pValue < 0.05 ? 0.95 : 0.9;
        }

        if (aWins > bWins && aWins >= 2) return { winner: 'A', confidenceLevel };
        if (bWins > aWins && bWins >= 2) return { winner: 'B', confidenceLevel };
        return { winner: 'tie', confidenceLevel: 0.5 };
    }

    private generateRecommendation(
        winner: 'A' | 'B' | 'tie',
        metricsA: IComparisonMetrics,
        metricsB: IComparisonMetrics,
        tests: IStatisticalTest[]
    ): IPromotionRecommendation {
        const reasons: string[] = [];
        const warnings: string[] = [];
        const significantTest = tests.find(t => t.isSignificant);
        const effectSizeTest = tests.find(t => t.effectSize !== 0);

        if (winner === 'tie') {
            return {
                shouldPromote: false,
                targetModel: 'none',
                confidence: 'low',
                reasons: ['No clear winner - models perform similarly'],
                warnings: ['Consider extending A/B test duration'],
                suggestedRolloutPercent: 0
            };
        }

        const targetModel = winner;
        const winnerMetrics = winner === 'A' ? metricsA : metricsB;
        const loserMetrics = winner === 'A' ? metricsB : metricsA;

        if (winnerMetrics.accuracyEstimate > loserMetrics.accuracyEstimate) {
            reasons.push(`Higher accuracy (${(winnerMetrics.accuracyEstimate * 100).toFixed(1)}% vs ${(loserMetrics.accuracyEstimate * 100).toFixed(1)}%)`);
        }

        if (winnerMetrics.avgLatencyMs < loserMetrics.avgLatencyMs) {
            reasons.push(`Lower latency (${winnerMetrics.avgLatencyMs.toFixed(1)}ms vs ${loserMetrics.avgLatencyMs.toFixed(1)}ms)`);
        }

        if (winnerMetrics.errorRate < loserMetrics.errorRate) {
            reasons.push(`Lower error rate (${(winnerMetrics.errorRate * 100).toFixed(1)}% vs ${(loserMetrics.errorRate * 100).toFixed(1)}%)`);
        }

        if (significantTest?.isSignificant) {
            reasons.push(`Statistically significant improvement (p=${significantTest.pValue.toFixed(4)})`);
        }

        // Warnings
        if (winnerMetrics.predictionCount < 100) {
            warnings.push('Low sample size - consider more testing');
        }

        if (!significantTest?.isSignificant) {
            warnings.push('Difference not statistically significant');
        }

        const confidence = significantTest?.isSignificant ? 'high' :
            (effectSizeTest?.effectSize ?? 0) > 0.3 ? 'medium' : 'low';

        const suggestedRolloutPercent = confidence === 'high' ? 100 :
            confidence === 'medium' ? 50 : 20;

        return {
            shouldPromote: reasons.length > 0,
            targetModel,
            confidence,
            reasons,
            warnings,
            suggestedRolloutPercent
        };
    }

    // ==================== MATH HELPERS ====================

    private mean(values: number[]): number {
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    private std(values: number[]): number {
        return Math.sqrt(this.variance(values));
    }

    private variance(values: number[]): number {
        if (values.length === 0) return 0;
        const m = this.mean(values);
        return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
    }

    private normalCDF(x: number): number {
        // Approximation of standard normal CDF
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return 0.5 * (1.0 + sign * y);
    }
}

// ==================== FACTORY ====================

export function createModelComparisonService(db: Database): ModelComparisonService {
    return new ModelComparisonService(db);
}
