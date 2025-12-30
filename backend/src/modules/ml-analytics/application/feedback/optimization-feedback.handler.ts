/**
 * Optimization Feedback Handler
 * Connects optimization results back to ML predictions for learning
 * 
 * Flow:
 * 1. Optimization completes with actual waste %
 * 2. Handler receives event
 * 3. Finds corresponding ML prediction
 * 4. Updates actualValue in ml_predictions table
 * 5. Triggers drift detection if needed
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, gte, isNull, desc } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions } from '../../../../db/schema/ml-analytics';
import { IServiceResult, MLModelType } from '../../domain';

const logger = createModuleLogger('OptimizationFeedback');

// ==================== TYPES ====================

export interface IOptimizationOutcome {
    /** Cutting job ID that was optimized */
    jobId: string;
    /** Scenario ID */
    scenarioId: string;
    /** Actual waste percentage from optimization result */
    actualWastePercent: number;
    /** Algorithm used */
    algorithmUsed: string;
    /** Stock sheets/bars used */
    stockUsedCount: number;
    /** Efficiency percentage */
    efficiency: number;
    /** Total optimization time in milliseconds */
    optimizationTimeMs: number;
    /** Timestamp of completion */
    completedAt: Date;
}

export interface IFeedbackStats {
    totalReceived: number;
    successfullyLinked: number;
    notFound: number;
    alreadyLinked: number;
}

// ==================== SERVICE ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export class OptimizationFeedbackHandler {
    private stats: IFeedbackStats = {
        totalReceived: 0,
        successfullyLinked: 0,
        notFound: 0,
        alreadyLinked: 0
    };

    constructor(
        private readonly db: Database
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Process optimization outcome and link to ML predictions
     */
    async processOutcome(outcome: IOptimizationOutcome): Promise<IServiceResult<{ linked: boolean }>> {
        this.stats.totalReceived++;

        try {
            logger.debug('Processing optimization outcome', {
                jobId: outcome.jobId,
                actualWaste: outcome.actualWastePercent
            });

            // Find predictions for this job that haven't been linked yet
            const lookbackWindow = new Date();
            lookbackWindow.setHours(lookbackWindow.getHours() - 24); // Look back 24 hours

            const predictions = await this.db.select()
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.jobId, outcome.jobId),
                    isNull(mlPredictions.actualValue),
                    gte(mlPredictions.createdAt, lookbackWindow)
                ))
                .orderBy(desc(mlPredictions.createdAt))
                .limit(10); // Could have multiple (primary + shadows)

            if (predictions.length === 0) {
                this.stats.notFound++;
                logger.debug('No unlinked predictions found for job', { jobId: outcome.jobId });
                return { success: true, data: { linked: false } };
            }

            // Update all predictions with actual value
            const actualValue = this.buildActualValue(outcome);

            for (const prediction of predictions) {
                await this.db.update(mlPredictions)
                    .set({
                        actualValue
                    })
                    .where(eq(mlPredictions.id, prediction.id));

                // Log drift if significant
                await this.checkAndLogDrift(prediction, outcome);
            }

            this.stats.successfullyLinked += predictions.length;

            logger.info('Linked optimization outcome to predictions', {
                jobId: outcome.jobId,
                predictionsLinked: predictions.length,
                actualWaste: outcome.actualWastePercent
            });

            return { success: true, data: { linked: true } };

        } catch (error) {
            logger.error('Failed to process outcome', { error, jobId: outcome.jobId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Processing failed'
            };
        }
    }

    /**
     * Bulk process multiple outcomes (e.g., from batch jobs)
     */
    async processBatch(outcomes: IOptimizationOutcome[]): Promise<IServiceResult<{
        processed: number;
        linked: number;
        failed: number;
    }>> {
        let processed = 0;
        let linked = 0;
        let failed = 0;

        for (const outcome of outcomes) {
            const result = await this.processOutcome(outcome);
            processed++;

            if (result.success && result.data?.linked) {
                linked++;
            } else if (!result.success) {
                failed++;
            }
        }

        return {
            success: true,
            data: { processed, linked, failed }
        };
    }

    /**
     * Get current feedback stats
     */
    getStats(): IFeedbackStats {
        return { ...this.stats };
    }

    /**
     * Reset stats (for testing/monitoring)
     */
    resetStats(): void {
        this.stats = {
            totalReceived: 0,
            successfullyLinked: 0,
            notFound: 0,
            alreadyLinked: 0
        };
    }

    // ==================== INTERNAL METHODS ====================

    private buildActualValue(outcome: IOptimizationOutcome): Record<string, unknown> {
        return {
            wastePercent: outcome.actualWastePercent,
            algorithmUsed: outcome.algorithmUsed,
            stockUsedCount: outcome.stockUsedCount,
            efficiency: outcome.efficiency,
            optimizationTimeMs: outcome.optimizationTimeMs,
            completedAt: outcome.completedAt.toISOString()
        };
    }

    private async checkAndLogDrift(
        prediction: typeof mlPredictions.$inferSelect,
        outcome: IOptimizationOutcome
    ): Promise<void> {
        const formattedPrediction = prediction.formattedPrediction as Record<string, unknown> | null;
        if (!formattedPrediction) return;

        const predictedWaste = Number(formattedPrediction.predictedWastePercent ?? 0);
        const actualWaste = outcome.actualWastePercent;
        const error = Math.abs(predictedWaste - actualWaste);

        // Log significant drift (>5% absolute error)
        if (error > 5) {
            logger.warn('Significant prediction drift detected', {
                modelType: prediction.modelType,
                modelVersion: prediction.modelVersion,
                predicted: predictedWaste,
                actual: actualWaste,
                error,
                jobId: outcome.jobId
            });
        }
    }
}

// ==================== FACTORY ====================

/**
 * Create feedback handler with default configuration
 */
export function createFeedbackHandler(db: Database): OptimizationFeedbackHandler {
    return new OptimizationFeedbackHandler(db);
}
