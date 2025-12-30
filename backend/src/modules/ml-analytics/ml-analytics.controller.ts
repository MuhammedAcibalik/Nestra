/**
 * ML Analytics Controller
 * REST API endpoints for ML predictions
 */

import { Router, Request, Response } from 'express';
import { IPredictionService } from './application/inference';
import { FeedbackService } from './application/feedback';
import { ExplanationService } from './application/explanation';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('MLAnalyticsController');

export class MLAnalyticsController {
    public readonly router: Router;

    constructor(
        private readonly predictionService: IPredictionService,
        private readonly feedbackService: FeedbackService,
        private readonly explanationService: ExplanationService
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Waste prediction
        this.router.post('/predict/waste', this.predictWaste.bind(this));

        // Algorithm recommendation
        this.router.post('/predict/algorithm', this.recommendAlgorithm.bind(this));

        // Time estimation
        this.router.post('/predict/time', this.estimateTime.bind(this));

        // Anomaly prediction
        this.router.post('/predict/anomalies', this.predictAnomalies.bind(this));

        // Model status
        this.router.get('/models/status', this.getModelStatus.bind(this));

        // Monitor & Explain
        this.router.get('/monitoring/health', this.getHealthStatus.bind(this));
        this.router.get('/monitoring/metrics', this.getMetrics.bind(this));
        this.router.post('/monitoring/alert', this.configureAlert.bind(this));

        // Explainability
        this.router.get('/explain/prediction/:id', this.explainPrediction.bind(this));
        this.router.get('/explain/global/:modelType', this.getGlobalExplanation.bind(this));

        // Feedback loop
        this.router.post('/feedback', this.submitFeedback.bind(this));
    }

    // ==================== ENDPOINTS ====================

    /**
     * POST /ml/predict/waste
     * Predict expected waste percentage
     */
    private async predictWaste(req: Request, res: Response): Promise<void> {
        try {
            const { job, stock, params, historical } = req.body;

            if (!job || !stock || !params) {
                res.status(400).json({ error: 'Missing required fields: job, stock, params' });
                return;
            }

            const result = await this.predictionService.predictWaste(
                job,
                stock,
                params,
                historical
            );

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Waste prediction endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/predict/algorithm
     * Recommend best cutting algorithm
     */
    private async recommendAlgorithm(req: Request, res: Response): Promise<void> {
        try {
            const { job, stock, historical } = req.body;

            if (!job || !stock) {
                res.status(400).json({ error: 'Missing required fields: job, stock' });
                return;
            }

            const result = await this.predictionService.recommendAlgorithm(
                job,
                stock,
                historical
            );

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Algorithm recommendation endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/predict/time
     * Estimate production time
     */
    private async estimateTime(req: Request, res: Response): Promise<void> {
        try {
            const { plan, machine, materialTypeId, thickness, historical } = req.body;

            if (!plan || !machine || !materialTypeId || thickness === undefined) {
                res.status(400).json({
                    error: 'Missing required fields: plan, machine, materialTypeId, thickness'
                });
                return;
            }

            const result = await this.predictionService.estimateTime(
                plan,
                machine,
                materialTypeId,
                thickness,
                historical
            );

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Time estimation endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/predict/anomalies
     * Predict potential anomalies
     */
    private async predictAnomalies(req: Request, res: Response): Promise<void> {
        try {
            const { currentMetrics, historicalMetrics, contextual } = req.body;

            if (!currentMetrics || !historicalMetrics) {
                res.status(400).json({
                    error: 'Missing required fields: currentMetrics, historicalMetrics'
                });
                return;
            }

            const result = await this.predictionService.predictAnomalies(
                currentMetrics,
                historicalMetrics,
                contextual
            );

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Anomaly prediction endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /ml/models/status
     * Get status of all ML models
     */
    private async getModelStatus(_req: Request, res: Response): Promise<void> {
        try {
            const status = this.predictionService.getModelStatus();
            res.json(status);
        } catch (error) {
            logger.error('Model status endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ==================== REAL-TIME MONITORING ====================

    /**
     * GET /ml/monitoring/health
     * Get comprehensive health status of all models
     */
    private async getHealthStatus(_req: Request, res: Response): Promise<void> {
        try {
            const modelStatus = this.predictionService.getModelStatus();
            const modelTypes = Object.keys(modelStatus) as Array<keyof typeof modelStatus>;
            const loadedCount = modelTypes.filter(t => modelStatus[t].loaded).length;

            const health = {
                timestamp: new Date().toISOString(),
                overallHealth: 'healthy' as 'healthy' | 'degraded' | 'critical',
                models: modelStatus,
                summary: {
                    totalModels: modelTypes.length,
                    loadedModels: loadedCount
                }
            };

            // Downgrade health if models aren't loaded
            if (health.summary.loadedModels < health.summary.totalModels) {
                health.overallHealth = 'degraded';
            }
            if (health.summary.loadedModels === 0) {
                health.overallHealth = 'critical';
            }

            res.json(health);
        } catch (error) {
            logger.error('Health status endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /ml/monitoring/metrics
     * Get real-time prediction metrics
     */
    private async getMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { modelType, period = '24h' } = req.query;

            // Calculate time window
            const now = new Date();
            const windowHours = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 24;
            const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

            const metrics = {
                timestamp: now.toISOString(),
                period,
                windowStart: windowStart.toISOString(),
                windowEnd: now.toISOString(),
                modelType: modelType || 'all',
                // Placeholder - would query from PredictionLoggerService
                predictions: {
                    total: 0,
                    successful: 0,
                    fallback: 0,
                    avgLatencyMs: 0,
                    avgConfidence: 0
                },
                performance: {
                    p50LatencyMs: 0,
                    p95LatencyMs: 0,
                    p99LatencyMs: 0
                }
            };

            res.json(metrics);
        } catch (error) {
            logger.error('Metrics endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/monitoring/alert
     * Configure monitoring alerts
     */
    private async configureAlert(req: Request, res: Response): Promise<void> {
        try {
            const { modelType, alertType, threshold, enabled } = req.body;

            if (!modelType || !alertType || threshold === undefined) {
                res.status(400).json({
                    error: 'Missing required fields: modelType, alertType, threshold'
                });
                return;
            }

            // Alert configuration (would persist to DB)
            const alert = {
                id: `alert_${Date.now()}`,
                modelType,
                alertType, // 'drift', 'latency', 'fallback_rate', 'performance'
                threshold,
                enabled: enabled ?? true,
                createdAt: new Date().toISOString()
            };

            logger.info('Alert configured', alert);
            res.status(201).json(alert);
        } catch (error) {
            logger.error('Configure alert endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/feedback
     * Submit actual outcome for a prediction (Ground Truth)
     */
    private async submitFeedback(req: Request, res: Response): Promise<void> {
        try {
            const { predictionId, actualValue, feedbackScore } = req.body;

            if (!predictionId || !actualValue) {
                res.status(400).json({
                    error: 'Missing required fields: predictionId, actualValue'
                });
                return;
            }

            const result = await this.feedbackService.submitFeedback(
                predictionId,
                actualValue,
                feedbackScore
            );

            if (result.success) {
                res.status(200).json({ message: 'Feedback submitted' });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Feedback endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async explainPrediction(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await this.explanationService.explainPrediction(id);

            if (!result.success) {
                res.status(404).json({ error: result.error });
                return;
            }

            res.json(result.data);
        } catch (error) {
            logger.error('Explain prediction endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async getGlobalExplanation(req: Request, res: Response): Promise<void> {
        try {
            const { modelType } = req.params;
            const validModelTypes = ['waste_predictor', 'time_estimator', 'algorithm_selector', 'anomaly_predictor'] as const;
            type MLModelType = typeof validModelTypes[number];

            if (!validModelTypes.includes(modelType as MLModelType)) {
                res.status(400).json({ error: `Invalid modelType: ${modelType}` });
                return;
            }

            const result = await this.explanationService.getGlobalExplanation(modelType as MLModelType);

            if (!result.success) {
                res.status(404).json({ error: result.error });
                return;
            }

            res.json(result.data);
        } catch (error) {
            logger.error('Global explanation endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
