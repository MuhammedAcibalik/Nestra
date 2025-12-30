/**
 * Feedback Service
 * Ingests actual outcomes to close the ML loop
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { mlPredictions } from '../../../../db/schema';
import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult } from '../../domain';

const logger = createModuleLogger('FeedbackService');

export class FeedbackService {
    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) { }

    /**
     * Submit actual value (ground truth) for a prediction
     */
    async submitFeedback(
        predictionId: string,
        actualValue: Record<string, unknown>,
        feedbackScore?: number
    ): Promise<IServiceResult<void>> {
        try {
            // Check if prediction exists
            const [prediction] = await this.db.select()
                .from(mlPredictions)
                .where(eq(mlPredictions.id, predictionId))
                .limit(1);

            if (!prediction) {
                return { success: false, error: 'Prediction not found' };
            }

            // Update prediction with actual value
            await this.db.update(mlPredictions)
                .set({
                    actualValue,
                    feedbackScore: feedbackScore ?? this.calculateImplicitScore(
                        (prediction.formattedPrediction ?? {}) as Record<string, unknown>,
                        actualValue
                    ),
                    feedbackAt: new Date()
                })
                .where(eq(mlPredictions.id, predictionId));

            logger.info('Feedback submitted', { predictionId, score: feedbackScore });

            return { success: true, data: undefined };

        } catch (error) {
            logger.error('Failed to submit feedback', { predictionId, error });
            return { success: false, error: 'Internal server error' };
        }
    }

    /**
     * Calculate implicit score (0-1) based on prediction vs actual
     * Simplified heuristic - can be expanded
     */
    private calculateImplicitScore(prediction: Record<string, unknown>, actual: Record<string, unknown>): number {
        // Precise match
        if (JSON.stringify(prediction) === JSON.stringify(actual)) {
            return 1;
        }

        // Numeric comparison (assuming single value 'result' or similar)
        if (typeof prediction.result === 'number' && typeof actual.result === 'number') {
            const pred = prediction.result;
            const act = actual.result;

            if (act === 0) return pred === 0 ? 1 : 0;

            // Calculate percentage error
            const error = Math.abs((pred - act) / act);
            return Math.max(0, 1 - error); // 1 = perfect, 0 = >100% error
        }

        return 0.5; // Default neutral if unknown comparison
    }
}
