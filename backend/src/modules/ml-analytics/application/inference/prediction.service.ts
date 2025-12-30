/**
 * Prediction Service (ONNX)
 * Orchestrates ML predictions using ONNX models
 */

import {
    WastePredictorModel,
    AlgorithmSelectorModel,
    TimeEstimatorModel,
    AnomalyPredictorModel
} from '../../infrastructure/models';
import { featureExtractor } from '../feature-engineering';
import {
    IWastePrediction,
    IAlgorithmPrediction,
    ITimePrediction,
    IAnomalyPrediction,
    MLModelType
} from '../../domain';
import { onnxProvider } from '../../infrastructure/onnx';
import { createModuleLogger } from '../../../../core/logger';

const logger = createModuleLogger('PredictionService');

// Simple service result type
type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };

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

// ==================== SERVICE INTERFACE ====================

export interface IPredictionService {
    initialize(): Promise<void>;

    predictWaste(
        job: ICuttingJobInput,
        stock: IStockInput[],
        params: IOptimizationParams,
        historical?: IHistoricalContext
    ): Promise<IServiceResult<IWastePrediction>>;

    recommendAlgorithm(
        job: ICuttingJobInput,
        stock: IStockInput[],
        historical?: IHistoricalContext
    ): Promise<IServiceResult<IAlgorithmPrediction>>;

    estimateTime(
        plan: IPlanInput,
        machine: IMachineInput,
        materialTypeId: string,
        thickness: number,
        historical?: IHistoricalContext
    ): Promise<IServiceResult<ITimePrediction>>;

    predictAnomalies(
        currentMetrics: { waste: number; time: number; efficiency: number },
        historicalMetrics: { avgWaste: number; avgTime: number; avgEfficiency: number },
        contextual?: { recentAnomalyCount?: number }
    ): Promise<IServiceResult<IAnomalyPrediction>>;

    getModelStatus(): Record<MLModelType, { loaded: boolean; version: string }>;
}

// ==================== SERVICE IMPLEMENTATION ====================

export class PredictionService implements IPredictionService {
    private wasteModel: WastePredictorModel;
    private algorithmModel: AlgorithmSelectorModel;
    private timeModel: TimeEstimatorModel;
    private anomalyModel: AnomalyPredictorModel;
    private initialized = false;

    constructor() {
        this.wasteModel = new WastePredictorModel();
        this.algorithmModel = new AlgorithmSelectorModel();
        this.timeModel = new TimeEstimatorModel();
        this.anomalyModel = new AnomalyPredictorModel();
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize ONNX Runtime
            await onnxProvider.initialize();

            // Initialize models (will load from disk if available)
            await Promise.all([
                this.wasteModel.initialize(),
                this.algorithmModel.initialize(),
                this.timeModel.initialize(),
                this.anomalyModel.initialize()
            ]);

            this.initialized = true;
            logger.info('ONNX Prediction service initialized');
        } catch (error) {
            logger.error('Failed to initialize prediction service', { error });
            throw error;
        }
    }

    async predictWaste(
        job: ICuttingJobInput,
        stock: IStockInput[],
        params: IOptimizationParams,
        historical: IHistoricalContext = {}
    ): Promise<IServiceResult<IWastePrediction>> {
        try {
            await this.ensureInitialized();

            const features = featureExtractor.extractWastePredictionFeatures(
                job,
                stock,
                params,
                historical
            );

            const prediction = await this.wasteModel.predictWaste(features);

            logger.debug('Waste prediction made', {
                jobId: job.id,
                predictedWaste: prediction.predictedWastePercent
            });

            return { success: true, data: prediction };
        } catch (error) {
            logger.error('Waste prediction failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Prediction failed'
            };
        }
    }

    async recommendAlgorithm(
        job: ICuttingJobInput,
        stock: IStockInput[],
        historical: IHistoricalContext = {}
    ): Promise<IServiceResult<IAlgorithmPrediction>> {
        try {
            await this.ensureInitialized();

            const features = featureExtractor.extractAlgorithmSelectionFeatures(
                job,
                stock,
                historical
            );

            const prediction = await this.algorithmModel.recommendAlgorithm(features);

            logger.debug('Algorithm recommendation made', {
                jobId: job.id,
                recommended: prediction.recommendedAlgorithm
            });

            return { success: true, data: prediction };
        } catch (error) {
            logger.error('Algorithm recommendation failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Recommendation failed'
            };
        }
    }

    async estimateTime(
        plan: IPlanInput,
        machine: IMachineInput,
        materialTypeId: string,
        thickness: number,
        historical: IHistoricalContext = {}
    ): Promise<IServiceResult<ITimePrediction>> {
        try {
            await this.ensureInitialized();

            const features = featureExtractor.extractTimeEstimationFeatures(
                plan,
                machine,
                materialTypeId,
                thickness,
                historical
            );

            const prediction = await this.timeModel.estimateTime(features);

            logger.debug('Time estimation made', {
                machineId: machine.id,
                estimatedMinutes: prediction.estimatedMinutes
            });

            return { success: true, data: prediction };
        } catch (error) {
            logger.error('Time estimation failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Estimation failed'
            };
        }
    }

    async predictAnomalies(
        currentMetrics: { waste: number; time: number; efficiency: number },
        historicalMetrics: { avgWaste: number; avgTime: number; avgEfficiency: number },
        contextual: { recentAnomalyCount?: number } = {}
    ): Promise<IServiceResult<IAnomalyPrediction>> {
        try {
            await this.ensureInitialized();

            const now = new Date();

            const features = featureExtractor.extractAnomalyPredictionFeatures(
                currentMetrics,
                historicalMetrics,
                {
                    recentAnomalyCount: contextual.recentAnomalyCount ?? 0,
                    dayOfWeek: now.getDay(),
                    hourOfDay: now.getHours()
                }
            );

            const prediction = await this.anomalyModel.predictAnomalies(features);

            logger.debug('Anomaly prediction made', {
                riskScore: prediction.riskScore,
                isHighRisk: prediction.isHighRisk
            });

            return { success: true, data: prediction };
        } catch (error) {
            logger.error('Anomaly prediction failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Prediction failed'
            };
        }
    }

    getModelStatus(): Record<MLModelType, { loaded: boolean; version: string }> {
        return {
            waste_predictor: {
                loaded: this.wasteModel.isReady(),
                version: this.wasteModel.getMetadata().version
            },
            algorithm_selector: {
                loaded: this.algorithmModel.isReady(),
                version: this.algorithmModel.getMetadata().version
            },
            time_estimator: {
                loaded: this.timeModel.isReady(),
                version: this.timeModel.getMetadata().version
            },
            anomaly_predictor: {
                loaded: this.anomalyModel.isReady(),
                version: this.anomalyModel.getMetadata().version
            }
        };
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }
}
