/**
 * ML Analytics Module Factory
 * Dependency injection setup for the ML module
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { MLAnalyticsController } from './ml-analytics.controller';

// Services
import { ModelRegistryService } from './infrastructure/registry';
import { PredictionLoggerService } from './infrastructure/monitoring';
import { ABTestingService } from './infrastructure/ab-testing';
import { DriftDetectorService } from './application/monitoring';
import { EnhancedPredictionService } from './application/inference';
import { FeedbackService } from './application/feedback';
import { ExplanationService } from './application/explanation';

export function createMLAnalyticsController(
    db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
): MLAnalyticsController {
    // Infrastructure
    const registryService = new ModelRegistryService(db);
    const loggerService = new PredictionLoggerService(db);
    const abTestingService = new ABTestingService(db);

    // Application
    const driftDetectorService = new DriftDetectorService(db);

    const predictionService = new EnhancedPredictionService(
        undefined, // db not needed directly if registry is provided
        registryService,
        loggerService
    );

    const feedbackService = new FeedbackService(db);
    const explanationService = new ExplanationService(db);

    // Controller
    return new MLAnalyticsController(predictionService, feedbackService, explanationService);
}
