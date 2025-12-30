/**
 * Application Monitoring - Index
 */

export {
    DriftDetectorService,
    type IFeatureDistribution,
    type IBaselineDistribution,
    type IDriftScore,
    type IDriftReport
} from './drift-detector.service';

// New enhanced drift detection with PSI and KS-test
export {
    DriftDetectionService,
    createDriftDetectionService,
    type IFeatureDriftMetrics,
    type IDriftConfig,
    type DriftSeverity,
    type DriftRecommendation
} from './drift-detection.service';
