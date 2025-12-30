/**
 * Enhanced Prediction Service
 * Integrates with ModelRegistry for production model loading
 * and PredictionLogger for tracking all predictions
 */

import {
    WastePredictorModel,
    AlgorithmSelectorModel,
    TimeEstimatorModel,
    AnomalyPredictorModel,
    BaseONNXModel
} from '../../infrastructure/models';
import { ModelRegistryService, MLModelType } from '../../infrastructure/registry';
import { PredictionLoggerService, recordPredictionWithContext } from '../../infrastructure/monitoring';
import { featureExtractor } from '../feature-engineering';
import {
    IWastePrediction,
    IAlgorithmPrediction,
    ITimePrediction,
    IAnomalyPrediction
} from '../../domain';
import { onnxProvider } from '../../infrastructure/onnx';
import { createModuleLogger } from '../../../../core/logger';
import { Database } from '../../../../db';
import { ExperimentService } from '../experimentation';
import { buildUnitKey } from '../../infrastructure/middleware';
import { VariantType } from '../../domain';

const logger = createModuleLogger('EnhancedPredictionService');

// Simple service result type
type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// ==================== MODEL LOADER ====================

interface IModelLoader {
    loadModel(modelType: MLModelType): Promise<BaseONNXModel | null>;
    getRegistry?(): ModelRegistryService | null;
}

/**
 * Registry-based model loader - loads from production models in DB
 */
class RegistryModelLoader implements IModelLoader {
    constructor(
        private readonly registry: ModelRegistryService
    ) { }

    getRegistry(): ModelRegistryService {
        return this.registry;
    }

    async loadModel(modelType: MLModelType): Promise<BaseONNXModel | null> {
        const result = await this.registry.getProductionModel(modelType);

        if (!result.success || !result.data) {
            logger.debug('No production model in registry', { modelType });
            return null;
        }

        const modelData = result.data;

        // Create model instance based on type with version from registry
        let model: BaseONNXModel;
        switch (modelType) {
            case 'waste_predictor':
                model = new WastePredictorModel(modelData.version);
                break;
            case 'algorithm_selector':
                model = new AlgorithmSelectorModel(modelData.version);
                break;
            case 'time_estimator':
                model = new TimeEstimatorModel(modelData.version);
                break;
            case 'anomaly_predictor':
                model = new AnomalyPredictorModel(modelData.version);
                break;
        }

        logger.info('Using production model from registry', {
            modelType,
            version: modelData.version
        });

        return model;
    }
}

/**
 * Default model loader - creates models with default versions
 */
class DefaultModelLoader implements IModelLoader {
    async loadModel(modelType: MLModelType): Promise<BaseONNXModel> {
        switch (modelType) {
            case 'waste_predictor':
                return new WastePredictorModel();
            case 'algorithm_selector':
                return new AlgorithmSelectorModel();
            case 'time_estimator':
                return new TimeEstimatorModel();
            case 'anomaly_predictor':
                return new AnomalyPredictorModel();
        }
    }
}

// ==================== INTERFACES ====================

interface ICuttingJobInput {
    id: string;
    materialTypeId: string;
    thickness: number;
    items: Array<{
        width?: number;
        height?: number;
        length?: number;
        quantity: number;
        canRotate?: boolean;
        grainDirection?: string;
    }>;
}

interface IStockInput {
    id: string;
    width?: number;
    height?: number;
    length?: number;
    quantity: number;
    unitPrice?: number;
}

interface IOptimizationParams {
    kerf: number;
    allowRotation: boolean;
}

interface IPlanInput {
    totalPieces: number;
    totalCuts: number;
    wastePercentage: number;
    stockUsedCount: number;
}

interface IMachineInput {
    id: string;
    machineType: string;
}

interface IHistoricalContext {
    avgWastePercent?: number;
    lastJobWaste?: number;
    avgProductionTime?: number;
    recentAnomalyCount?: number;
    algorithmPerformance?: {
        BOTTOM_LEFT: number;
        GUILLOTINE: number;
        MAXRECTS: number;
    };
}

interface IPredictionContext {
    userId?: string;
    tenantId?: string;
    jobId?: string;
    anonymousId?: string;
}

// ==================== ENHANCED SERVICE ====================

export interface IEnhancedPredictionService {
    initialize(): Promise<void>;

    predictWaste(
        job: ICuttingJobInput,
        stock: IStockInput[],
        params: IOptimizationParams,
        historical?: IHistoricalContext,
        context?: IPredictionContext
    ): Promise<IServiceResult<IWastePrediction>>;

    recommendAlgorithm(
        job: ICuttingJobInput,
        stock: IStockInput[],
        historical?: IHistoricalContext,
        context?: IPredictionContext
    ): Promise<IServiceResult<IAlgorithmPrediction>>;

    estimateTime(
        plan: IPlanInput,
        machine: IMachineInput,
        materialTypeId: string,
        thickness: number,
        historical?: IHistoricalContext,
        context?: IPredictionContext
    ): Promise<IServiceResult<ITimePrediction>>;

    predictAnomalies(
        currentMetrics: { waste: number; time: number; efficiency: number },
        historicalMetrics: { avgWaste: number; avgTime: number; avgEfficiency: number },
        contextual?: { recentAnomalyCount?: number },
        context?: IPredictionContext
    ): Promise<IServiceResult<IAnomalyPrediction>>;

    getModelStatus(): Record<MLModelType, { loaded: boolean; version: string; isProduction: boolean }>;

    reloadModels(): Promise<void>;

    // Batch prediction methods
    predictWasteBatch(
        jobs: Array<{
            job: ICuttingJobInput;
            stock: IStockInput[];
            params: IOptimizationParams;
            historical?: IHistoricalContext;
        }>,
        context?: IPredictionContext
    ): Promise<IServiceResult<IWastePrediction[]>>;

    recommendAlgorithmBatch(
        jobs: Array<{
            job: ICuttingJobInput;
            stock: IStockInput[];
            historical?: IHistoricalContext;
        }>,
        context?: IPredictionContext
    ): Promise<IServiceResult<IAlgorithmPrediction[]>>;
}

export class EnhancedPredictionService implements IEnhancedPredictionService {
    private wasteModel: WastePredictorModel | null = null;
    private algorithmModel: AlgorithmSelectorModel | null = null;
    private timeModel: TimeEstimatorModel | null = null;
    private anomalyModel: AnomalyPredictorModel | null = null;
    // Map to store shadow models per type
    private shadowModels: Map<MLModelType, BaseONNXModel[]> = new Map();
    // Map to store variant models for A/B testing
    private variantModels: Map<string, BaseONNXModel> = new Map();
    private initialized = false;
    private modelLoader: IModelLoader;
    private predictionLogger?: PredictionLoggerService;
    private experimentService?: ExperimentService;
    private experimentsEnabled: boolean;

    constructor(
        private readonly db?: Database,
        registry?: ModelRegistryService,
        predictionLogger?: PredictionLoggerService,
        experimentService?: ExperimentService
    ) {
        // Use registry loader if available, otherwise default
        this.modelLoader = registry
            ? new RegistryModelLoader(registry)
            : new DefaultModelLoader();
        this.predictionLogger = predictionLogger;
        this.experimentService = experimentService;
        this.experimentsEnabled = process.env.EXPERIMENTS_ENABLED !== 'false';
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize ONNX Runtime
            await onnxProvider.initialize();

            // Load models (from registry or defaults)
            const [waste, algorithm, time, anomaly] = await Promise.all([
                this.modelLoader.loadModel('waste_predictor'),
                this.modelLoader.loadModel('algorithm_selector'),
                this.modelLoader.loadModel('time_estimator'),
                this.modelLoader.loadModel('anomaly_predictor')
            ]);

            this.wasteModel = waste as WastePredictorModel ?? new WastePredictorModel();
            this.algorithmModel = algorithm as AlgorithmSelectorModel ?? new AlgorithmSelectorModel();
            this.timeModel = time as TimeEstimatorModel ?? new TimeEstimatorModel();
            this.anomalyModel = anomaly as AnomalyPredictorModel ?? new AnomalyPredictorModel();

            // Initialize all models
            await Promise.all([
                this.wasteModel.initialize(),
                this.algorithmModel.initialize(),
                this.timeModel.initialize(),
                this.anomalyModel.initialize()
            ]);

            // Load Shadow Models
            if (this.db) { // Need DB access for registry lookups
                // This part relies on specific casting because IModelLoader interface is generic
                if (this.modelLoader instanceof RegistryModelLoader) {
                    await this.loadShadowModels('waste_predictor', WastePredictorModel);
                    await this.loadShadowModels('algorithm_selector', AlgorithmSelectorModel);
                    await this.loadShadowModels('time_estimator', TimeEstimatorModel);
                    await this.loadShadowModels('anomaly_predictor', AnomalyPredictorModel);
                }
            }

            this.initialized = true;
            logger.info('Enhanced Prediction Service initialized', {
                wasteVersion: this.wasteModel.getMetadata().version,
                algorithmVersion: this.algorithmModel.getMetadata().version,
                timeVersion: this.timeModel.getMetadata().version,
                anomalyVersion: this.anomalyModel.getMetadata().version,
                shadowCounts: {
                    waste: this.shadowModels.get('waste_predictor')?.length || 0,
                    algorithm: this.shadowModels.get('algorithm_selector')?.length || 0
                }
            });
        } catch (error) {
            logger.error('Failed to initialize enhanced prediction service', { error });
            throw error;
        }
    }

    async reloadModels(): Promise<void> {
        logger.info('Reloading models from registry');
        this.initialized = false;
        await this.initialize();
    }

    private async executeWithShadow<T, F = unknown>(
        modelType: MLModelType,
        primaryModel: BaseONNXModel | null,
        features: F,
        predictFn: (model: BaseONNXModel) => Promise<T>,
        context: IPredictionContext,
        errorMessage: string
    ): Promise<IServiceResult<T>> {
        if (!primaryModel) return { success: false, error: `${modelType} not loaded` };

        // A/B Testing Resolution
        let assignedVariant: VariantType | null = null;
        let servedVariant: VariantType = 'control';
        let experimentId: string | null = null;
        let modelToUse: BaseONNXModel = primaryModel;

        if (this.experimentsEnabled && this.experimentService) {
            try {
                const unitKey = buildUnitKey(context.userId, context.tenantId, context.anonymousId);
                const resolution = await this.experimentService.resolveExperiment(modelType, unitKey, context.tenantId);

                if (resolution.experiment && resolution.assignedVariant) {
                    experimentId = resolution.experiment.id;
                    assignedVariant = resolution.assignedVariant;

                    // If assigned to variant, try to load variant model
                    if (assignedVariant === 'variant') {
                        const variantModel = this.variantModels.get(resolution.experiment.variantModelId);
                        if (variantModel) {
                            modelToUse = variantModel;
                            servedVariant = 'variant';
                        } else {
                            // Fail-open: Log and fall back to control
                            logger.warn('Variant model not loaded, falling back to control', {
                                experimentId,
                                variantModelId: resolution.experiment.variantModelId
                            });
                            servedVariant = 'control';
                        }
                    }
                }
            } catch (expError) {
                logger.error('Experiment resolution failed, using control', { error: expError });
                // Fail-open: continue with control
            }
        }

        // 1. Execute Model
        let result: T;
        const startTime = Date.now();
        try {
            result = await predictFn(modelToUse);
            const latencyMs = Date.now() - startTime;

            // Log prediction with experiment context
            await this.logPredictionWithExperiment(
                modelType,
                features,
                result,
                context,
                experimentId,
                assignedVariant,
                servedVariant,
                modelToUse.getMetadata().version,
                latencyMs
            );

            // Record metrics
            recordPredictionWithContext({
                modelType,
                variant: servedVariant,
                status: 'success',
                latencyMs,
                experimentId
            });
        } catch (error) {
            const latencyMs = Date.now() - startTime;
            logger.error(`${errorMessage}`, { error, servedVariant });

            // If variant failed, try control (fail-open)
            if (servedVariant === 'variant' && modelToUse !== primaryModel) {
                logger.info('Variant execution failed, retrying with control');
                try {
                    result = await predictFn(primaryModel);
                    await this.logPredictionWithExperiment(
                        modelType, features, result, context,
                        experimentId, assignedVariant, 'control',
                        primaryModel.getMetadata().version, Date.now() - startTime,
                        'VARIANT_FAILED'
                    );
                    return { success: true, data: result };
                } catch (controlError) {
                    logger.error('Control fallback also failed', { error: controlError });
                }
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : errorMessage
            };
        }

        // 2. Execute Shadow Models (Fire and Forget) - Skip if A/B is active
        if (!experimentId) {
            const shadows = this.shadowModels.get(modelType) || [];
            if (shadows.length > 0) {
                this.executeShadowModels(modelType, shadows, features, predictFn, context);
            }
        }

        return { success: true, data: result };
    }

    private executeShadowModels<T, F = unknown>(
        modelType: MLModelType,
        shadows: BaseONNXModel[],
        features: F,
        predictFn: (model: BaseONNXModel) => Promise<T>,
        context: IPredictionContext
    ): void {
        Promise.all(shadows.map(async (shadowModel) => {
            try {
                const shadowResult = await predictFn(shadowModel);
                await this.logPrediction(modelType, features, shadowResult, context, 'shadow');
            } catch (err) {
                logger.warn(`Shadow execution failed for ${modelType}`, {
                    version: shadowModel.getMetadata().version,
                    error: err
                });
            }
        })).catch(err => logger.error('Shadow execution error', { err }));
    }

    // Load shadow models for a specific type
    private async loadShadowModels(
        modelType: MLModelType,
        ModelClass: new (version?: string) => BaseONNXModel
    ): Promise<void> {
        const registry = this.modelLoader.getRegistry?.();
        if (!registry) return;

        const result = await registry.getShadowModels(modelType);
        if (result.success && result.data) {
            const models = result.data.map((m: { version: string }) => new ModelClass(m.version));
            await Promise.all(models.map((model) => model.initialize()));
            this.shadowModels.set(modelType, models);
        }
    }

    private async logPredictionWithExperiment(
        modelType: MLModelType,
        features: unknown,
        prediction: unknown,
        context: IPredictionContext,
        experimentId: string | null,
        assignedVariant: VariantType | null,
        servedVariant: VariantType,
        modelVersion: string,
        latencyMs: number,
        errorCode?: string
    ): Promise<void> {
        if (!this.predictionLogger) return;

        try {
            await this.predictionLogger.logPrediction({
                modelType,
                modelVersion,
                inputFeatures: features as Record<string, number>,
                rawPrediction: [],
                formattedPrediction: prediction as Record<string, unknown>,
                userId: context.userId,
                tenantId: context.tenantId,
                jobId: context.jobId,
                executionType: 'primary',
                // A/B Testing fields (will be added to logger interface)
                experimentId,
                assignedVariant,
                servedVariant,
                latencyMs,
                errorCode
            });
        } catch (error) {
            logger.warn('Failed to log prediction with experiment', { error });
        }
    }

    async predictWaste(
        job: ICuttingJobInput,
        stock: IStockInput[],
        params: IOptimizationParams,
        historical: IHistoricalContext = {},
        context: IPredictionContext = {}
    ): Promise<IServiceResult<IWastePrediction>> {
        await this.ensureInitialized();
        const features = featureExtractor.extractWastePredictionFeatures(job, stock, params, historical);

        return this.executeWithShadow(
            'waste_predictor',
            this.wasteModel,
            features,
            (m) => (m as WastePredictorModel).predictWaste(features),
            context,
            'Waste prediction failed'
        );
    }

    // ... Repeat for others or keep existing logic refactored?
    // Let's refactor recommendAlgorithm as well

    async recommendAlgorithm(
        job: ICuttingJobInput,
        stock: IStockInput[],
        historical: IHistoricalContext = {},
        context: IPredictionContext = {}
    ): Promise<IServiceResult<IAlgorithmPrediction>> {
        await this.ensureInitialized();
        const features = featureExtractor.extractAlgorithmSelectionFeatures(job, stock, historical);

        return this.executeWithShadow(
            'algorithm_selector',
            this.algorithmModel,
            features,
            (m) => (m as AlgorithmSelectorModel).recommendAlgorithm(features),
            context,
            'Algorithm recommendation failed'
        );
    }

    async estimateTime(
        plan: IPlanInput,
        machine: IMachineInput,
        materialTypeId: string,
        thickness: number,
        historical: IHistoricalContext = {},
        context: IPredictionContext = {}
    ): Promise<IServiceResult<ITimePrediction>> {
        await this.ensureInitialized();
        const features = featureExtractor.extractTimeEstimationFeatures(plan, machine, materialTypeId, thickness, historical);

        return this.executeWithShadow(
            'time_estimator',
            this.timeModel,
            features,
            (m) => (m as TimeEstimatorModel).estimateTime(features),
            context,
            'Time estimation failed'
        );
    }

    async predictAnomalies(
        currentMetrics: { waste: number; time: number; efficiency: number },
        historicalMetrics: { avgWaste: number; avgTime: number; avgEfficiency: number },
        contextual: { recentAnomalyCount?: number } = {},
        context: IPredictionContext = {}
    ): Promise<IServiceResult<IAnomalyPrediction>> {
        await this.ensureInitialized();
        const now = new Date();
        const features = featureExtractor.extractAnomalyPredictionFeatures(
            currentMetrics,
            historicalMetrics,
            { recentAnomalyCount: contextual.recentAnomalyCount ?? 0, dayOfWeek: now.getDay(), hourOfDay: now.getHours() }
        );

        return this.executeWithShadow(
            'anomaly_predictor',
            this.anomalyModel,
            features,
            (m) => (m as AnomalyPredictorModel).predictAnomalies(features),
            context,
            'Anomaly prediction failed'
        );
    }

    getModelStatus(): Record<MLModelType, { loaded: boolean; version: string; isProduction: boolean }> {
        return {
            waste_predictor: {
                loaded: this.wasteModel?.isReady() ?? false,
                version: this.wasteModel?.getMetadata().version ?? 'N/A',
                isProduction: true // TODO: Track from registry
            },
            algorithm_selector: {
                loaded: this.algorithmModel?.isReady() ?? false,
                version: this.algorithmModel?.getMetadata().version ?? 'N/A',
                isProduction: true
            },
            time_estimator: {
                loaded: this.timeModel?.isReady() ?? false,
                version: this.timeModel?.getMetadata().version ?? 'N/A',
                isProduction: true
            },
            anomaly_predictor: {
                loaded: this.anomalyModel?.isReady() ?? false,
                version: this.anomalyModel?.getMetadata().version ?? 'N/A',
                isProduction: true
            }
        };
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    private async logPrediction(
        modelType: MLModelType,
        features: unknown,
        prediction: unknown,
        context: IPredictionContext,
        executionType: 'primary' | 'shadow' = 'primary'
    ): Promise<void> {
        if (!this.predictionLogger) return;

        try {
            await this.predictionLogger.logPrediction({
                modelType,
                modelVersion: (prediction as { modelVersion?: string }).modelVersion ?? 'unknown',
                inputFeatures: features as Record<string, number>,
                rawPrediction: [],
                formattedPrediction: prediction as Record<string, unknown>,
                userId: context.userId,
                tenantId: context.tenantId,
                jobId: context.jobId,
                executionType
            });
        } catch (error) {
            logger.warn('Failed to log prediction', { error });
        }
    }

    // ==================== BATCH PREDICTIONS ====================

    async predictWasteBatch(
        jobs: Array<{
            job: ICuttingJobInput;
            stock: IStockInput[];
            params: IOptimizationParams;
            historical?: IHistoricalContext;
        }>,
        context: IPredictionContext = {}
    ): Promise<IServiceResult<IWastePrediction[]>> {
        try {
            await this.ensureInitialized();

            const startTime = Date.now();
            const results: IWastePrediction[] = [];

            // Process in parallel with concurrency limit
            const BATCH_SIZE = 10;
            for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
                const batch = jobs.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(
                    batch.map(async ({ job, stock, params, historical }) => {
                        const result = await this.predictWaste(job, stock, params, historical || {}, context);
                        return result.success ? result.data : null;
                    })
                );
                results.push(...batchResults.filter((r): r is IWastePrediction => r !== null));
            }

            logger.info('Batch waste prediction completed', {
                totalJobs: jobs.length,
                successful: results.length,
                durationMs: Date.now() - startTime
            });

            return { success: true, data: results };
        } catch (error) {
            logger.error('Batch waste prediction failed', { error });
            return { success: false, error: 'Batch prediction failed' };
        }
    }

    async recommendAlgorithmBatch(
        jobs: Array<{
            job: ICuttingJobInput;
            stock: IStockInput[];
            historical?: IHistoricalContext;
        }>,
        context: IPredictionContext = {}
    ): Promise<IServiceResult<IAlgorithmPrediction[]>> {
        try {
            await this.ensureInitialized();

            const startTime = Date.now();
            const results: IAlgorithmPrediction[] = [];

            // Process in parallel with concurrency limit
            const BATCH_SIZE = 10;
            for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
                const batch = jobs.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(
                    batch.map(async ({ job, stock, historical }) => {
                        const result = await this.recommendAlgorithm(job, stock, historical || {}, context);
                        return result.success ? result.data : null;
                    })
                );
                results.push(...batchResults.filter((r): r is IAlgorithmPrediction => r !== null));
            }

            logger.info('Batch algorithm recommendation completed', {
                totalJobs: jobs.length,
                successful: results.length,
                durationMs: Date.now() - startTime
            });

            return { success: true, data: results };
        } catch (error) {
            logger.error('Batch algorithm recommendation failed', { error });
            return { success: false, error: 'Batch recommendation failed' };
        }
    }
}
