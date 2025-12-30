/**
 * Base ONNX Model
 * Abstract class for ONNX-based ML models
 */

import { onnxProvider, ort, InferenceRunner, createInferenceRunner } from '../onnx';
import { IMLModelMetadata, IModelMetrics, MLModelType, ModelStatus } from '../../domain';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';
import path from 'node:path';
import fs from 'node:fs/promises';

const logger = createModuleLogger('BaseONNXModel');

// ==================== NORMALIZATION PARAMS ====================

export interface INormalizationParams {
    means: number[];
    stds: number[];
}

// ==================== ABSTRACT BASE MODEL ====================

export abstract class BaseONNXModel {
    protected runner: InferenceRunner | null = null;
    protected metadata: IMLModelMetadata;
    protected normParams: INormalizationParams | null = null;
    protected readonly modelPath: string;
    protected readonly metadataPath: string;

    constructor(
        protected readonly modelType: MLModelType,
        version: string = '1.0.0'
    ) {
        const modelsDir = onnxProvider.getModelsDir();
        this.modelPath = path.join(modelsDir, `${modelType}.onnx`);
        this.metadataPath = path.join(modelsDir, `${modelType}_metadata.json`);

        this.metadata = {
            id: uuid(),
            modelType,
            version,
            status: 'draft',
            isProduction: false,
            metrics: {},
            modelPath: this.modelPath,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    // ==================== ABSTRACT METHODS ====================

    /**
     * Get feature order for this model
     */
    abstract getFeatureOrder(): string[];

    /**
     * Get default normalization when no trained params
     */
    protected abstract getDefaultNormParams(): INormalizationParams;

    // ==================== COMMON METHODS ====================

    /**
     * Initialize model (load from disk if available)
     */
    async initialize(): Promise<void> {
        try {
            // Initialize ONNX provider
            await onnxProvider.initialize();

            // Try to load model
            const loaded = await onnxProvider.loadModel(this.modelType, this.modelPath);

            if (loaded) {
                this.runner = createInferenceRunner(this.modelType);
                await this.loadMetadata();
                this.metadata.status = 'active';
                logger.info('ONNX model loaded', {
                    modelType: this.modelType,
                    version: this.metadata.version
                });
            } else {
                // Model not found - use fallback mode
                this.metadata.status = 'draft';
                this.normParams = this.getDefaultNormParams();
                logger.info('Model not found, using fallback mode', {
                    modelType: this.modelType
                });
            }
        } catch (error) {
            logger.error('Failed to initialize model', { error });
            this.metadata.status = 'draft';
            this.normParams = this.getDefaultNormParams();
        }
    }

    /**
     * Preprocess features using normalization
     */
    preprocessFeatures(features: Record<string, number>): number[] {
        const params = this.normParams ?? this.getDefaultNormParams();
        const featureOrder = this.getFeatureOrder();

        return featureOrder.map((key, i) => {
            const value = features[key] ?? 0;
            const mean = params.means[i] ?? 0;
            const std = params.stds[i] ?? 1;
            return (value - mean) / (std || 1);
        });
    }

    /**
     * Make prediction
     */
    async predict(features: Record<string, number>): Promise<number[]> {
        if (!this.runner || !this.runner.isReady()) {
            // Return fallback prediction
            return this.getFallbackPrediction(features);
        }

        const preprocessed = this.preprocessFeatures(features);
        const result = await this.runner.run(preprocessed);
        return result.output;
    }

    /**
     * Fallback prediction when model not loaded
     */
    protected abstract getFallbackPrediction(features: Record<string, number>): number[];

    /**
     * Load metadata from disk
     */
    private async loadMetadata(): Promise<void> {
        try {
            const data = await fs.readFile(this.metadataPath, 'utf-8');
            const saved = JSON.parse(data);
            this.metadata = { ...this.metadata, ...saved };
            this.normParams = saved.normParams ?? this.getDefaultNormParams();
        } catch (error) {
            // Metadata file not found - this is expected for new models
            logger.debug('Metadata file not found, using defaults', {
                path: this.metadataPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            this.normParams = this.getDefaultNormParams();
        }
    }

    /**
     * Save metadata to disk
     */
    async saveMetadata(): Promise<void> {
        try {
            const data = {
                ...this.metadata,
                normParams: this.normParams,
                updatedAt: new Date()
            };
            await fs.writeFile(this.metadataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            logger.error('Failed to save metadata', { error });
        }
    }

    /**
     * Check if model is ready for inference
     */
    isReady(): boolean {
        return this.runner?.isReady() ?? false;
    }

    /**
     * Get model metadata
     */
    getMetadata(): IMLModelMetadata {
        return { ...this.metadata };
    }

    /**
     * Get model status
     */
    getStatus(): ModelStatus {
        return this.metadata.status;
    }

    /**
     * Set normalization params (from training)
     */
    setNormParams(params: INormalizationParams): void {
        this.normParams = params;
    }

    /**
     * Get normalization params
     */
    getNormParams(): INormalizationParams | null {
        return this.normParams;
    }
}
