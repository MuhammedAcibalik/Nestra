/**
 * Experiment Controller
 * REST API endpoints for A/B testing experiment management (Admin only)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ExperimentService } from './application/experimentation';
import { IExperimentConfig, ExperimentStatus } from './domain';
import { createModuleLogger } from '../../core/logger';
import { z } from 'zod';

const logger = createModuleLogger('ExperimentController');

// ==================== REQUEST SCHEMAS ====================

const createExperimentSchema = z.object({
    modelType: z.enum(['waste_predictor', 'time_estimator', 'algorithm_selector', 'anomaly_predictor']),
    scopeType: z.enum(['global', 'tenant']).default('global'),
    scopeTenantId: z.uuid().optional(),
    controlModelId: z.uuid(),
    variantModelId: z.uuid(),
    allocationBasisPoints: z.number().int().min(0).max(10000),
    salt: z.string().min(1).max(100),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});

const updateStatusSchema = z.object({
    status: z.enum(['active', 'paused', 'completed'])
});

const listFiltersSchema = z.object({
    modelType: z.enum(['waste_predictor', 'time_estimator', 'algorithm_selector', 'anomaly_predictor']).optional(),
    status: z.enum(['active', 'paused', 'completed']).optional()
});

// ==================== CONTROLLER ====================

export class ExperimentController {
    public readonly router: Router;

    constructor(
        private readonly experimentService: ExperimentService
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // List experiments
        this.router.get('/', this.listExperiments.bind(this));

        // Create experiment
        this.router.post('/', this.createExperiment.bind(this));

        // Update status
        this.router.patch('/:id/status', this.updateStatus.bind(this));

        // Get stats (placeholder)
        this.router.get('/:id/stats', this.getStats.bind(this));
    }

    // ==================== ENDPOINTS ====================

    /**
     * GET /experiments
     * List all experiments with optional filtering
     */
    private async listExperiments(req: Request, res: Response): Promise<void> {
        try {
            const parseResult = listFiltersSchema.safeParse(req.query);
            if (!parseResult.success) {
                res.status(400).json({ error: 'Invalid query parameters', details: parseResult.error.issues });
                return;
            }

            const filters = parseResult.data;
            const result = await this.experimentService.listExperiments({
                modelType: filters.modelType,
                status: filters.status as ExperimentStatus | undefined
            });

            if (!result.success) {
                res.status(500).json({ error: result.error });
                return;
            }

            res.json({
                experiments: result.data,
                count: result.data?.length ?? 0
            });
        } catch (error) {
            logger.error('List experiments endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /experiments
     * Create a new experiment
     */
    private async createExperiment(req: Request, res: Response): Promise<void> {
        try {
            const parseResult = createExperimentSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(400).json({ error: 'Invalid request body', details: parseResult.error.issues });
                return;
            }

            const config = parseResult.data;

            // Validate scope consistency
            if (config.scopeType === 'tenant' && !config.scopeTenantId) {
                res.status(400).json({ error: 'scopeTenantId is required when scopeType is tenant' });
                return;
            }
            if (config.scopeType === 'global' && config.scopeTenantId) {
                res.status(400).json({ error: 'scopeTenantId must not be set when scopeType is global' });
                return;
            }

            const experimentConfig: IExperimentConfig = {
                modelType: config.modelType,
                scopeType: config.scopeType,
                scopeTenantId: config.scopeTenantId,
                controlModelId: config.controlModelId,
                variantModelId: config.variantModelId,
                allocationBasisPoints: config.allocationBasisPoints,
                salt: config.salt,
                startDate: config.startDate ? new Date(config.startDate) : undefined,
                endDate: config.endDate ? new Date(config.endDate) : undefined
            };

            const result = await this.experimentService.createExperiment(experimentConfig);

            if (!result.success) {
                res.status(400).json({ error: result.error });
                return;
            }

            res.status(201).json(result.data);
        } catch (error) {
            logger.error('Create experiment endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * PATCH /experiments/:id/status
     * Update experiment status
     */
    private async updateStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const parseResult = updateStatusSchema.safeParse(req.body);

            if (!parseResult.success) {
                res.status(400).json({ error: 'Invalid request body', details: parseResult.error.issues });
                return;
            }

            const { status } = parseResult.data;
            const result = await this.experimentService.updateStatus(id, status as ExperimentStatus);

            if (!result.success) {
                res.status(400).json({ error: result.error });
                return;
            }

            res.json(result.data);
        } catch (error) {
            logger.error('Update status endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /experiments/:id/stats
     * Get experiment statistics (placeholder)
     */
    private async getStats(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // TODO: Implement stats aggregation from ml_predictions
            // This would query predictions with experiment_id = id
            // and calculate: count(control), count(variant), avg_latency per group, etc.

            res.json({
                experimentId: id,
                message: 'Stats endpoint placeholder - implementation pending',
                stats: {
                    control: { count: 0, avgLatencyMs: 0, errorRate: 0 },
                    variant: { count: 0, avgLatencyMs: 0, errorRate: 0 }
                }
            });
        } catch (error) {
            logger.error('Get stats endpoint error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
