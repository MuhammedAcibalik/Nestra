/**
 * Model Registry Service
 * Manages ML model versions, deployment, and lifecycle
 */

import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
    mlModels,
    MLModel,
    NewMLModel,
    modelStatusEnum
} from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';
import fs from 'node:fs/promises';
import path from 'node:path';

const logger = createModuleLogger('ModelRegistry');

// ==================== TYPES ====================

export type IServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

// ==================== TYPES ====================

export type ModelStatus = 'draft' | 'training' | 'validating' | 'staging' | 'production' | 'archived' | 'failed';
export type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';

export interface IModelRegistration {
    modelType: MLModelType;
    version: string;
    modelPath: string;
    metadataPath?: string;
    name?: string;
    description?: string;
    metrics?: {
        trainLoss?: number;
        valLoss?: number;
        accuracy?: number;
    };
    normParams?: {
        means: number[];
        stds: number[];
    };
    featureOrder?: string[];
    inputSize?: number;
    trainingDataCount?: number;
    trainingDuration?: number;
}

export interface IModelFilter {
    modelType?: MLModelType;
    status?: ModelStatus;
    isProduction?: boolean;
    version?: string;
}

// ==================== SERVICE ====================

export class ModelRegistryService {
    constructor(private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }) { }

    /**
     * Register a new model version
     */
    async registerModel(registration: IModelRegistration): Promise<IServiceResult<MLModel>> {
        try {
            // Verify model file exists
            await fs.access(registration.modelPath);

            const newModel: NewMLModel = {
                id: uuid(),
                modelType: registration.modelType,
                version: registration.version,
                name: registration.name ?? `${registration.modelType} v${registration.version}`,
                description: registration.description,
                status: 'draft',
                isProduction: false,
                modelPath: registration.modelPath,
                metadataPath: registration.metadataPath,
                trainedAt: new Date(),
                trainingDuration: registration.trainingDuration,
                trainingDataCount: registration.trainingDataCount,
                metrics: registration.metrics,
                normParams: registration.normParams,
                featureOrder: registration.featureOrder,
                inputSize: registration.inputSize
            };

            const [model] = await this.db.insert(mlModels).values(newModel).returning();

            logger.info('Model registered', {
                modelId: model.id,
                modelType: model.modelType,
                version: model.version
            });

            return { success: true, data: model };
        } catch (error) {
            logger.error('Failed to register model', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to register model'
            };
        }
    }

    /**
     * Get model by ID
     */
    async getModel(modelId: string): Promise<IServiceResult<MLModel>> {
        try {
            const [model] = await this.db
                .select()
                .from(mlModels)
                .where(eq(mlModels.id, modelId))
                .limit(1);

            if (!model) {
                return { success: false, error: 'Model not found' };
            }

            return { success: true, data: model };
        } catch (error) {
            logger.error('Failed to get model', { error });
            return { success: false, error: 'Failed to get model' };
        }
    }

    /**
     * Get production model for a given type
     */
    async getProductionModel(modelType: MLModelType): Promise<IServiceResult<MLModel>> {
        try {
            const [model] = await this.db
                .select()
                .from(mlModels)
                .where(
                    and(
                        eq(mlModels.modelType, modelType),
                        eq(mlModels.isProduction, true)
                    )
                )
                .limit(1);

            if (!model) {
                return { success: false, error: `No production model for ${modelType}` };
            }

            return { success: true, data: model };
        } catch (error) {
            logger.error('Failed to get production model', { error });
            return { success: false, error: 'Failed to get production model' };
        }
    }

    /**
     * Get shadow models (staging) for a given type
     */
    async getShadowModels(modelType: MLModelType): Promise<IServiceResult<MLModel[]>> {
        try {
            const models = await this.db
                .select()
                .from(mlModels)
                .where(
                    and(
                        eq(mlModels.modelType, modelType),
                        eq(mlModels.status, 'staging')
                    )
                );

            return { success: true, data: models };
        } catch (error) {
            logger.error('Failed to get shadow models', { error });
            return { success: false, error: 'Failed to get shadow models' };
        }
    }

    /**
     * List models with optional filtering
     */
    async listModels(filter: IModelFilter = {}): Promise<IServiceResult<MLModel[]>> {
        try {
            const conditions = [];

            if (filter.modelType) {
                conditions.push(eq(mlModels.modelType, filter.modelType));
            }
            if (filter.status) {
                conditions.push(eq(mlModels.status, filter.status));
            }
            if (filter.isProduction !== undefined) {
                conditions.push(eq(mlModels.isProduction, filter.isProduction));
            }
            if (filter.version) {
                conditions.push(eq(mlModels.version, filter.version));
            }

            const query = this.db
                .select()
                .from(mlModels)
                .orderBy(desc(mlModels.createdAt));

            const models = conditions.length > 0
                ? await query.where(and(...conditions))
                : await query;

            return { success: true, data: models };
        } catch (error) {
            logger.error('Failed to list models', { error });
            return { success: false, error: 'Failed to list models' };
        }
    }

    /**
     * Promote model to production
     */
    async promoteToProduction(modelId: string, promotedBy?: string): Promise<IServiceResult<MLModel>> {
        try {
            // Get the model
            const modelResult = await this.getModel(modelId);
            if (!modelResult.success || !modelResult.data) {
                return { success: false, error: 'Model not found' };
            }

            const model = modelResult.data;

            // Demote current production model of this type
            await this.db
                .update(mlModels)
                .set({
                    isProduction: false,
                    status: 'archived',
                    updatedAt: new Date()
                })
                .where(
                    and(
                        eq(mlModels.modelType, model.modelType),
                        eq(mlModels.isProduction, true)
                    )
                );

            // Promote new model
            const [promoted] = await this.db
                .update(mlModels)
                .set({
                    status: 'production',
                    isProduction: true,
                    promotedBy,
                    promotedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(mlModels.id, modelId))
                .returning();

            logger.info('Model promoted to production', {
                modelId: promoted.id,
                modelType: promoted.modelType,
                version: promoted.version
            });

            return { success: true, data: promoted };
        } catch (error) {
            logger.error('Failed to promote model', { error });
            return { success: false, error: 'Failed to promote model' };
        }
    }

    /**
     * Rollback to previous production model
     */
    async rollback(modelType: MLModelType): Promise<IServiceResult<MLModel>> {
        try {
            // Find the most recent archived model
            const [previousModel] = await this.db
                .select()
                .from(mlModels)
                .where(
                    and(
                        eq(mlModels.modelType, modelType),
                        eq(mlModels.status, 'archived')
                    )
                )
                .orderBy(desc(mlModels.promotedAt))
                .limit(1);

            if (!previousModel) {
                return { success: false, error: 'No previous model to rollback to' };
            }

            return this.promoteToProduction(previousModel.id);
        } catch (error) {
            logger.error('Failed to rollback model', { error });
            return { success: false, error: 'Failed to rollback model' };
        }
    }

    /**
     * Update model status
     */
    async updateStatus(modelId: string, status: ModelStatus): Promise<IServiceResult<MLModel>> {
        try {
            const [updated] = await this.db
                .update(mlModels)
                .set({ status, updatedAt: new Date() })
                .where(eq(mlModels.id, modelId))
                .returning();

            if (!updated) {
                return { success: false, error: 'Model not found' };
            }

            return { success: true, data: updated };
        } catch (error) {
            logger.error('Failed to update model status', { error });
            return { success: false, error: 'Failed to update status' };
        }
    }

    /**
     * Delete model (soft delete - marks as archived)
     */
    async archiveModel(modelId: string): Promise<IServiceResult<void>> {
        try {
            await this.db
                .update(mlModels)
                .set({ status: 'archived', updatedAt: new Date() })
                .where(eq(mlModels.id, modelId));

            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to archive model', { error });
            return { success: false, error: 'Failed to archive model' };
        }
    }
}
