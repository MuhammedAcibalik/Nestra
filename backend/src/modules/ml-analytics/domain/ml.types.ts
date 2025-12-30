/**
 * ML Analytics - Domain Types
 * Type definitions for ML models, features, and predictions
 */

// ==================== COMMON TYPES ====================

export interface IServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ==================== MODEL TYPES ====================

export type MLModelType = 'waste_predictor' | 'algorithm_selector' | 'time_estimator' | 'anomaly_predictor';
export type ModelStatus = 'draft' | 'training' | 'validating' | 'active' | 'deprecated';
export type AlgorithmType = 'BOTTOM_LEFT' | 'GUILLOTINE' | 'MAXRECTS';

export interface IMLModelMetadata {
    id: string;
    modelType: MLModelType;
    version: string;
    status: ModelStatus;
    isProduction: boolean;

    // Training info
    trainedAt?: Date;
    trainingDuration?: number;
    trainingSamples?: number;

    // Metrics
    metrics: IModelMetrics;

    // Paths
    modelPath: string;
    weightsPath?: string;

    createdAt: Date;
    updatedAt: Date;
}

export interface IModelMetrics {
    // Regression metrics
    mae?: number;      // Mean Absolute Error
    mse?: number;      // Mean Squared Error
    rmse?: number;     // Root Mean Squared Error
    mape?: number;     // Mean Absolute Percentage Error

    // Classification metrics
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;

    // Validation
    trainLoss?: number;
    valLoss?: number;
    trainAccuracy?: number;
    valAccuracy?: number;
}

// ==================== FEATURE TYPES ====================

export interface IWastePredictionFeatures {
    // Job characteristics
    totalPieceCount: number;
    uniquePieceCount: number;
    avgPieceArea: number;
    pieceAreaStdDev: number;
    minPieceArea: number;
    maxPieceArea: number;
    pieceAspectRatioMean: number;
    pieceAspectRatioStdDev: number;

    // Stock characteristics
    totalStockArea: number;
    stockSheetCount: number;
    avgStockArea: number;
    stockAspectRatio: number;

    // Ratios
    totalDemandToStockRatio: number;
    pieceToStockSizeRatio: number;

    // Algorithm parameters
    kerf: number;
    allowRotation: number; // 0 or 1

    // Material (one-hot encoded later)
    materialTypeIndex: number;

    // Historical context
    historicalAvgWaste: number;
    lastJobWaste: number;
}

export interface IAlgorithmSelectionFeatures {
    // Piece distribution
    pieceSizeVariance: number;
    smallPieceRatio: number;
    largePieceRatio: number;
    squarePieceRatio: number;

    // Complexity
    uniqueShapeCount: number;
    rotationAllowed: number;
    grainConstraintRatio: number;

    // Stock characteristics
    stockVariety: number;
    standardSizeRatio: number;

    // Historical performance per algorithm
    bottomLeftHistoricalWaste: number;
    guillotineHistoricalWaste: number;
    maxrectsHistoricalWaste: number;

    // Job scale
    totalPieceCount: number;
    totalStockCount: number;
}

export interface ITimeEstimationFeatures {
    // Plan characteristics
    totalPieces: number;
    totalCuts: number;
    wastePercentage: number;
    stockUsedCount: number;

    // Machine characteristics
    machineType: number;
    machineSpeed: number;

    // Material
    materialTypeIndex: number;
    thickness: number;

    // Complexity
    averagePieceArea: number;
    maxPieceArea: number;

    // Historical
    operatorAvgTime: number;
    machineAvgTime: number;
}

export interface IAnomalyPredictionFeatures {
    // Current job metrics
    currentWaste: number;
    currentTime: number;
    currentEfficiency: number;

    // Deviations from expected
    wasteDeviation: number;
    timeDeviation: number;
    efficiencyDeviation: number;

    // Historical patterns
    recentAnomalyCount: number;
    avgHistoricalWaste: number;
    avgHistoricalTime: number;

    // Environmental
    dayOfWeek: number;
    hourOfDay: number;
    isWeekend: number;
}

// ==================== PREDICTION TYPES ====================

export interface IWastePrediction {
    predictedWastePercent: number;
    confidence: number;
    modelVersion: string;
    predictionId: string;
    timestamp: Date;
}

export interface IAlgorithmPrediction {
    recommendedAlgorithm: AlgorithmType;
    probabilities: {
        BOTTOM_LEFT: number;
        GUILLOTINE: number;
        MAXRECTS: number;
    };
    confidence: number;
    reasoning: string;
    modelVersion: string;
    predictionId: string;
    timestamp: Date;
}

export interface ITimePrediction {
    estimatedMinutes: number;
    confidenceInterval: {
        low: number;
        high: number;
    };
    factors: string[];
    modelVersion: string;
    predictionId: string;
    timestamp: Date;
}

export interface IAnomalyPrediction {
    riskScore: number;
    predictedAnomalies: {
        type: string;
        probability: number;
    }[];
    isHighRisk: boolean;
    modelVersion: string;
    predictionId: string;
    timestamp: Date;
}

// ==================== TRAINING TYPES ====================

export interface ITrainingConfig {
    modelType: MLModelType;
    epochs: number;
    batchSize: number;
    validationSplit: number;
    learningRate: number;
    earlyStoppingPatience: number;

    // Optional
    optimizer?: 'adam' | 'sgd' | 'rmsprop';
    shuffle?: boolean;
    verbose?: boolean;
}

export interface ITrainingData {
    features: number[][];
    labels: number[][] | number[];

    // Metadata
    sampleCount: number;
    featureCount: number;
    labelType: 'regression' | 'classification';
    classCount?: number;
}

export interface ITrainingResult {
    success: boolean;
    modelId: string;
    version: string;

    // Training history
    epochs: number;
    history: {
        loss: number[];
        valLoss: number[];
        accuracy?: number[];
        valAccuracy?: number[];
    };

    // Final metrics
    metrics: IModelMetrics;

    // Timing
    trainingDuration: number;
    timestamp: Date;

    // Error (if failed)
    error?: string;
}

export interface ITrainingJob {
    id: string;
    modelType: MLModelType;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    config: ITrainingConfig;

    startedAt?: Date;
    completedAt?: Date;

    result?: ITrainingResult;
    error?: string;
}

// ==================== FEEDBACK TYPES ====================

export interface IPredictionFeedback {
    predictionId: string;
    modelType: MLModelType;

    // Predicted vs Actual
    predictedValue: number;
    actualValue: number;
    error: number;

    // Context
    scenarioId?: string;
    cuttingPlanId?: string;
    productionLogId?: string;

    timestamp: Date;
}

export interface IRetrainingTrigger {
    modelType: MLModelType;
    reason: 'scheduled' | 'performance_degradation' | 'new_data' | 'manual';
    newSamples: number;
    currentPerformance: number;
    threshold: number;
    triggeredAt: Date;
}

// ==================== TRAINING JOB TYPES ====================

/**
 * Training job configuration stored in mlTrainingJobs.config JSON field
 */
export interface ITrainingJobConfig {
    triggerType: 'drift' | 'performance' | 'scheduled' | 'manual';
    triggerValue: number;
    threshold: number;
    hyperparameters?: Record<string, number | string | boolean>;
    validationSplit?: number;
    epochs?: number;
    batchSize?: number;
}

/**
 * Training job metrics stored in mlTrainingJobs.metrics JSON field
 */
export interface ITrainingJobMetrics {
    trainLoss: number;
    valLoss: number;
    accuracy?: number;
    mae?: number;
    mse?: number;
    epochs?: number;
    trainingTimeMs?: number;
}

// ==================== EXPLANATION TYPES ====================

export interface ILocalExplanation {
    baseline: number;
    contributions: Record<string, number>; // Feature name -> Contribution value
    prediction?: number; // The logic: baseline + sum(contributions) should approx equal prediction
}

export interface IGlobalExplanation {
    shapValues: Record<string, number>; // Feature name -> Mean absolut SHAP value
    featureImportance: Record<string, number>; // Feature name -> Importance score (0-1)
    summary?: string;
}

export interface IExplanationRequest {
    modelType: MLModelType;
    modelPath: string;
    inputData: Record<string, unknown>;
    backgroundDataPath?: string;
}
