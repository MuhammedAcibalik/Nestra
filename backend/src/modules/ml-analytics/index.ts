/**
 * ML Analytics Module (ONNX)
 */

// Domain
export * from './domain';

// Infrastructure
export { onnxProvider, ort } from './infrastructure/onnx';
export {
    BaseONNXModel,
    WastePredictorModel,
    AlgorithmSelectorModel,
    TimeEstimatorModel,
    AnomalyPredictorModel
} from './infrastructure/models';
export { ModelRegistryService } from './infrastructure/registry';
export { PredictionLoggerService } from './infrastructure/monitoring';
export { TrainingDataPipelineService, TrainingDataExportJob, createDefaultExportJob } from './infrastructure/data-pipeline';
export { MLPredictionClientAdapter } from './infrastructure/adapters';

// Application - Core
export { featureExtractor, FeatureExtractor, FeatureStoreService, IFeatureDefinition, IFeatureSet } from './application/feature-engineering';
export { PredictionService, IPredictionService, EnhancedPredictionService, IEnhancedPredictionService } from './application/inference';
export { MLAdminController } from './application/admin';
export { DriftDetectorService } from './application/monitoring';
export { AutoRetrainingService, IRetrainingConfig, IRetrainingTrigger, IModelHealth } from './application/retraining';
export { ExplainabilityService, IFeatureImportance, IPredictionExplanation } from './application/explainability';
export { FeedbackService, OptimizationFeedbackHandler, createFeedbackHandler } from './application/feedback';

// Application - Shadow Mode & Comparison
export { ShadowComparisonService, IModelAccuracy, IComparisonResult, IPromotionConfig } from './application/shadow';

// Application - Advanced ML
export { ExplanationService, getExplanationService, IExplanationResult, IFeatureContribution } from './application/explainability';
export { EnsembleService, getEnsembleService, IEnsembleConfig, IEnsemblePrediction, IModelWeight } from './application/ensemble';
export { HyperparameterTuningService, getHyperparameterTuningService, ITuningConfig, ITrial, ITuningResult } from './application/tuning';
export { BanditService } from './application/bandit';
export { CanaryDeploymentService } from './application/canary';

// Controller
export { MLAnalyticsController } from './ml-analytics.controller';

// Module Factory
export { createMLAnalyticsController } from './ml-analytics.module';
