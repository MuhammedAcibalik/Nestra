/**
 * ML Admin Controller
 * REST API endpoints for ML model management and monitoring
 */

import { Router, Request, Response } from 'express';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ModelRegistryService, MLModelType, ModelStatus } from '../../infrastructure/registry';
import { PredictionLoggerService } from '../../infrastructure/monitoring';
import { createModuleLogger } from '../../../../core/logger';
import { requireRole } from '../../../../middleware/role.middleware';

const logger = createModuleLogger('MLAdminController');

// ==================== TYPE DEFINITIONS ====================

// Valid model types for validation
const VALID_MODEL_TYPES: MLModelType[] = ['waste_predictor', 'time_estimator', 'algorithm_selector', 'anomaly_predictor'];
const VALID_STATUSES: ModelStatus[] = ['draft', 'training', 'validating', 'staging', 'production', 'archived', 'failed'];

// Extended request interface for authenticated requests
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

// Type guard for model type
function isValidModelType(value: unknown): value is MLModelType {
    return typeof value === 'string' && VALID_MODEL_TYPES.includes(value as MLModelType);
}

// Type guard for model status
function isValidModelStatus(value: unknown): value is ModelStatus {
    return typeof value === 'string' && VALID_STATUSES.includes(value as ModelStatus);
}

// Parse string to number safely
function parseIntSafe(value: unknown, defaultValue: number): number {
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
}

export class MLAdminController {
    public readonly router: Router;
    private readonly registryService: ModelRegistryService;
    private readonly loggerService: PredictionLoggerService;

    constructor(db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }) {
        this.router = Router();
        this.registryService = new ModelRegistryService(db);
        this.loggerService = new PredictionLoggerService(db);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Model Registry - requires admin or manager role
        this.router.get('/registry/models', requireRole('admin', 'manager'), this.listModels.bind(this));
        this.router.get('/registry/models/:id', requireRole('admin', 'manager'), this.getModel.bind(this));
        this.router.post('/registry/models', requireRole('admin'), this.registerModel.bind(this));
        this.router.post('/registry/models/:id/promote', requireRole('admin'), this.promoteModel.bind(this));
        this.router.post('/registry/models/:modelType/rollback', requireRole('admin'), this.rollbackModel.bind(this));
        this.router.delete('/registry/models/:id', requireRole('admin'), this.archiveModel.bind(this));

        // Prediction Logs - requires manager or admin
        this.router.get('/monitoring/predictions', requireRole('admin', 'manager'), this.getPredictions.bind(this));
        this.router.get('/monitoring/stats', requireRole('admin', 'manager'), this.getStats.bind(this));
        this.router.post('/monitoring/predictions/:id/feedback', requireRole('admin', 'manager'), this.submitFeedback.bind(this));
    }

    // ==================== MODEL REGISTRY ENDPOINTS ====================

    /**
     * GET /ml/admin/registry/models
     * List all registered models
     */
    private async listModels(req: Request, res: Response): Promise<void> {
        try {
            const { modelType, status, isProduction } = req.query;

            const result = await this.registryService.listModels({
                modelType: isValidModelType(modelType) ? modelType : undefined,
                status: isValidModelStatus(status) ? status : undefined,
                isProduction: isProduction === 'true' ? true : isProduction === 'false' ? false : undefined
            });

            if (result.success) {
                res.json({ models: result.data, count: result.data.length });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('List models error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /ml/admin/registry/models/:id
     * Get model by ID
     */
    private async getModel(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const result = await this.registryService.getModel(id);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Get model error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/admin/registry/models
     * Register a new model
     */
    private async registerModel(req: Request, res: Response): Promise<void> {
        try {
            const registration: unknown = req.body;

            // Type validation
            if (!registration || typeof registration !== 'object') {
                res.status(400).json({ error: 'Invalid request body' });
                return;
            }

            const body = registration as Record<string, unknown>;

            if (!isValidModelType(body.modelType)) {
                res.status(400).json({ error: `Invalid modelType. Valid types: ${VALID_MODEL_TYPES.join(', ')}` });
                return;
            }

            if (typeof body.version !== 'string' || typeof body.modelPath !== 'string') {
                res.status(400).json({ error: 'Missing required fields: version, modelPath' });
                return;
            }

            const result = await this.registryService.registerModel({
                modelType: body.modelType,
                version: body.version,
                modelPath: body.modelPath,
                name: typeof body.name === 'string' ? body.name : undefined,
                description: typeof body.description === 'string' ? body.description : undefined,
                metadataPath: typeof body.metadataPath === 'string' ? body.metadataPath : undefined,
                inputSize: typeof body.inputSize === 'number' ? body.inputSize : undefined,
                trainingDataCount: typeof body.trainingDataCount === 'number' ? body.trainingDataCount : undefined,
                trainingDuration: typeof body.trainingDuration === 'number' ? body.trainingDuration : undefined
            });

            if (result.success) {
                res.status(201).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Register model error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/admin/registry/models/:id/promote
     * Promote model to production
     */
    private async promoteModel(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const result = await this.registryService.promoteToProduction(id, userId);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Promote model error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/admin/registry/models/:modelType/rollback
     * Rollback to previous production model
     */
    private async rollbackModel(req: Request, res: Response): Promise<void> {
        try {
            const { modelType } = req.params;

            if (!isValidModelType(modelType)) {
                res.status(400).json({ error: `Invalid modelType. Valid types: ${VALID_MODEL_TYPES.join(', ')}` });
                return;
            }

            const result = await this.registryService.rollback(modelType);

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Rollback model error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * DELETE /ml/admin/registry/models/:id
     * Archive a model
     */
    private async archiveModel(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const result = await this.registryService.archiveModel(id);

            if (result.success) {
                res.status(204).send();
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Archive model error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ==================== MONITORING ENDPOINTS ====================

    /**
     * GET /ml/admin/monitoring/predictions
     * Get prediction logs
     */
    private async getPredictions(req: Request, res: Response): Promise<void> {
        try {
            const { modelType, modelVersion, startDate, endDate, jobId, limit, offset } = req.query;

            const result = await this.loggerService.getPredictions(
                {
                    modelType: isValidModelType(modelType) ? modelType : undefined,
                    modelVersion: typeof modelVersion === 'string' ? modelVersion : undefined,
                    startDate: typeof startDate === 'string' ? new Date(startDate) : undefined,
                    endDate: typeof endDate === 'string' ? new Date(endDate) : undefined,
                    jobId: typeof jobId === 'string' ? jobId : undefined
                },
                parseIntSafe(limit, 100),
                parseIntSafe(offset, 0)
            );

            if (result.success) {
                res.json({ predictions: result.data, count: result.data.length });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Get predictions error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /ml/admin/monitoring/stats
     * Get prediction statistics
     */
    private async getStats(req: Request, res: Response): Promise<void> {
        try {
            const { modelType, startDate, endDate } = req.query;

            const validModelType = isValidModelType(modelType) ? modelType : undefined;
            const validStartDate = typeof startDate === 'string' ? new Date(startDate) : undefined;
            const validEndDate = typeof endDate === 'string' ? new Date(endDate) : undefined;

            const result = await this.loggerService.getStats(
                validModelType,
                validStartDate,
                validEndDate
            );

            if (result.success) {
                res.json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Get stats error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /ml/admin/monitoring/predictions/:id/feedback
     * Submit ground truth feedback for a prediction
     */
    private async submitFeedback(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const body: unknown = req.body;

            if (!body || typeof body !== 'object') {
                res.status(400).json({ error: 'Invalid request body' });
                return;
            }

            const { actualValue, feedbackScore } = body as Record<string, unknown>;

            if (!actualValue || typeof actualValue !== 'object') {
                res.status(400).json({ error: 'Missing required field: actualValue (must be an object)' });
                return;
            }

            const score = typeof feedbackScore === 'number' ? feedbackScore : undefined;

            const result = await this.loggerService.submitFeedback(
                id,
                actualValue as Record<string, unknown>,
                score
            );

            if (result.success) {
                res.json({ message: 'Feedback submitted successfully' });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Submit feedback error', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
