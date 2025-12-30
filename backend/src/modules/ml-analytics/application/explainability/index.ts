/**
 * Explainability Module Exports
 */

export {
    ExplainabilityService,
    IFeatureImportance,
    IPredictionExplanation,
    IContrastiveExplanation,
    IFeatureInteraction
} from './explainability.service';

export { ExplanationService, getExplanationService } from './explanation.service';
export type {
    IFeatureContribution,
    IExplanationResult,
    IExplanationConfig
} from './explanation.service';

// Feature Importance Tracking
export {
    FeatureImportanceService,
    createFeatureImportanceService,
    type IFeatureImportance as IFeatureImportanceMetric,
    type IImportanceSnapshot,
    type IImportanceTrend,
    type IImportanceDrift
} from './feature-importance.service';
