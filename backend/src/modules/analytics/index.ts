/**
 * Analytics Module - Barrel Export
 * Tier 1 Analytics: Forecasting, Anomaly Detection, Recommendations
 */

// Domain models
export * from './domain';

// Application services
export {
    ForecastingService,
    IForecastingService
} from './application/forecasting.service';

export {
    AnomalyService,
    IAnomalyService
} from './application/anomaly.service';

export {
    RecommendationService,
    IRecommendationService
} from './application/recommendation.service';

// Infrastructure
export {
    AnalyticsRepository,
    IAnalyticsRepository
} from './infrastructure/analytics.repository';

export * from './infrastructure/time-series.helper';

// Controller
export { AnalyticsController } from './analytics.controller';

// Event Handler
export { AnalyticsEventHandler } from './analytics.event-handler';
