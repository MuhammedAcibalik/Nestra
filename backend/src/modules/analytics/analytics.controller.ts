/**
 * Analytics Controller
 * REST API endpoints for analytics features
 */

import { Router, Request, Response } from 'express';
import { IForecastingService } from './application/forecasting.service';
import { IAnomalyService } from './application/anomaly.service';
import { IRecommendationService } from './application/recommendation.service';
import { ForecastPeriod, ForecastMetric } from './domain';
import { createModuleLogger } from '../../core/logger';
import { analyticsGenerationRateLimiter } from '../../middleware/rate-limit.middleware';
import { validateAnomalyFilter, validateRecommendationFilter } from './application/analytics-validation';

const logger = createModuleLogger('AnalyticsController');

export class AnalyticsController {
    public readonly router: Router;

    constructor(
        private readonly forecastingService: IForecastingService,
        private readonly anomalyService: IAnomalyService,
        private readonly recommendationService: IRecommendationService
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Forecast routes
        this.router.get('/forecast/:metric', this.getForecast.bind(this));
        this.router.get('/forecast/orders/:period', this.getOrderForecast.bind(this));
        this.router.get('/forecast/stock/:materialId', this.getStockForecast.bind(this));
        this.router.get('/forecast/production/:period', this.getProductionForecast.bind(this));

        // Anomaly routes
        this.router.get('/anomalies', this.getAnomalies.bind(this));
        this.router.post('/anomalies/detect', analyticsGenerationRateLimiter, this.detectAnomalies.bind(this));
        this.router.patch('/anomalies/:id/acknowledge', this.acknowledgeAnomaly.bind(this));
        this.router.patch('/anomalies/:id/resolve', this.resolveAnomaly.bind(this));

        // Recommendation routes
        this.router.get('/recommendations', this.getRecommendations.bind(this));
        this.router.post('/recommendations/generate', analyticsGenerationRateLimiter, this.generateRecommendations.bind(this));
        this.router.patch('/recommendations/:id/dismiss', this.dismissRecommendation.bind(this));
        this.router.patch('/recommendations/:id/apply', this.applyRecommendation.bind(this));
    }

    // ==================== FORECAST ENDPOINTS ====================

    /**
     * GET /analytics/forecast/:metric
     * Get forecast for any metric
     */
    private async getForecast(req: Request, res: Response): Promise<void> {
        try {
            const metric = req.params.metric as ForecastMetric;
            const horizon = Number(req.query.horizon) || 7;
            const period = (req.query.period as ForecastPeriod) || 'day';
            const materialTypeId = req.query.materialTypeId as string | undefined;

            const result = await this.forecastingService.generateForecast({
                metric,
                period,
                horizon,
                materialTypeId
            });

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Forecast endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /analytics/forecast/orders/:period
     * Get order forecast
     */
    private async getOrderForecast(req: Request, res: Response): Promise<void> {
        try {
            const period = (req.params.period as ForecastPeriod) || 'day';
            const horizon = Number(req.query.horizon) || 7;

            const result = await this.forecastingService.getOrderForecast(horizon, period);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Order forecast endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /analytics/forecast/stock/:materialId
     * Get stock consumption forecast for a material
     */
    private async getStockForecast(req: Request, res: Response): Promise<void> {
        try {
            const materialId = req.params.materialId;
            const horizon = Number(req.query.horizon) || 14;

            const result = await this.forecastingService.getStockForecast(materialId, horizon);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Stock forecast endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /analytics/forecast/production/:period
     * Get production forecast
     */
    private async getProductionForecast(req: Request, res: Response): Promise<void> {
        try {
            const period = (req.params.period as ForecastPeriod) || 'day';
            const horizon = Number(req.query.horizon) || 7;

            const result = await this.forecastingService.getProductionForecast(horizon, period);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Production forecast endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ==================== ANOMALY ENDPOINTS ====================

    /**
     * GET /analytics/anomalies
     * Get recent anomalies
     */
    private async getAnomalies(req: Request, res: Response): Promise<void> {
        try {
            const validation = validateAnomalyFilter(req.query as Record<string, unknown>);

            if (!validation.success) {
                res.status(400).json({ error: 'Invalid query parameters', details: validation.errors });
                return;
            }

            const filter = validation.data!;

            const result = await this.anomalyService.getRecentAnomalies(filter);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Get anomalies endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /analytics/anomalies/detect
     * Trigger anomaly detection
     */
    private async detectAnomalies(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.anomalyService.detectAnomalies(req.body);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Detect anomalies endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * PATCH /analytics/anomalies/:id/acknowledge
     * Acknowledge an anomaly
     */
    private async acknowledgeAnomaly(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await this.anomalyService.acknowledgeAnomaly(id);

            if (result.success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Acknowledge anomaly endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * PATCH /analytics/anomalies/:id/resolve
     * Resolve an anomaly
     */
    private async resolveAnomaly(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await this.anomalyService.resolveAnomaly(id);

            if (result.success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Resolve anomaly endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ==================== RECOMMENDATION ENDPOINTS ====================

    /**
     * GET /analytics/recommendations
     * Get active recommendations
     */
    private async getRecommendations(req: Request, res: Response): Promise<void> {
        try {
            const validation = validateRecommendationFilter(req.query as Record<string, unknown>);

            if (!validation.success) {
                res.status(400).json({ error: 'Invalid query parameters', details: validation.errors });
                return;
            }

            const filter = validation.data!;

            const result = await this.recommendationService.getActiveRecommendations(filter);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Get recommendations endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /analytics/recommendations/generate
     * Generate new recommendations
     */
    private async generateRecommendations(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.recommendationService.generateRecommendations();

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Generate recommendations endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * PATCH /analytics/recommendations/:id/dismiss
     * Dismiss a recommendation
     */
    private async dismissRecommendation(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await this.recommendationService.dismissRecommendation(id);

            if (result.success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Dismiss recommendation endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * PATCH /analytics/recommendations/:id/apply
     * Apply a recommendation
     */
    private async applyRecommendation(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await this.recommendationService.applyRecommendation(id);

            if (result.success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Apply recommendation endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
