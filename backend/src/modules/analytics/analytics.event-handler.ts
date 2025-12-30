/**
 * Analytics Event Handler
 * Triggers analytics refresh on business events
 * Following Event-Driven Architecture for real-time insights
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, getEventAdapter } from '../../core/events';
import { EventBus } from '../../core/events/event-bus';
import { IForecastingService } from './application/forecasting.service';
import { IAnomalyService } from './application/anomaly.service';
import { IRecommendationService } from './application/recommendation.service';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('AnalyticsEventHandler');

// Debounce tracking to prevent excessive refreshes
interface IDebounceState {
    lastRefresh: number;
    pendingRefresh: NodeJS.Timeout | null;
}

const DEBOUNCE_MS = 30000; // 30 seconds between refreshes

// Analytics event types for publishing
const AnalyticsEventTypes = {
    ANOMALY_DETECTED: 'analytics.anomaly.detected',
    RECOMMENDATION_CREATED: 'analytics.recommendation.created',
    FORECAST_UPDATED: 'analytics.forecast.updated'
} as const;

export class AnalyticsEventHandler {
    private debounceState: Map<string, IDebounceState> = new Map();

    constructor(
        private readonly forecastingService: IForecastingService,
        private readonly anomalyService: IAnomalyService,
        private readonly recommendationService: IRecommendationService
    ) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Order events → refresh order forecast
        adapter.subscribe(EventTypes.ORDER_CREATED, this.handleOrderCreated.bind(this));
        adapter.subscribe(EventTypes.ORDER_COMPLETED, this.handleOrderCompleted.bind(this));

        // Stock events → refresh stock forecast & recommendations
        adapter.subscribe(EventTypes.STOCK_CONSUME_COMPLETED, this.handleStockConsumed.bind(this));
        adapter.subscribe(EventTypes.STOCK_RESERVE_COMPLETED, this.handleStockReserved.bind(this));

        // Production events → refresh production forecast & anomaly detection
        adapter.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        // Optimization events → refresh recommendations
        adapter.subscribe(EventTypes.OPTIMIZATION_COMPLETED, this.handleOptimizationCompleted.bind(this));

        logger.info('Analytics event handlers registered', {
            events: [
                'ORDER_CREATED', 'ORDER_COMPLETED',
                'STOCK_CONSUME_COMPLETED', 'STOCK_RESERVED',
                'PRODUCTION_COMPLETED', 'OPTIMIZATION_COMPLETED'
            ]
        });
    }

    // ==================== ORDER EVENTS ====================

    private async handleOrderCreated(event: IDomainEvent): Promise<void> {
        logger.debug('Order created event received', { orderId: event.aggregateId });

        await this.debouncedRefresh('order_forecast', async () => {
            await this.forecastingService.invalidateCache('orders');
            logger.info('Order forecast cache invalidated');
        });
    }

    private async handleOrderCompleted(event: IDomainEvent): Promise<void> {
        logger.debug('Order completed event received', { orderId: event.aggregateId });

        await this.debouncedRefresh('order_forecast', async () => {
            await this.forecastingService.invalidateCache('orders');
        });
    }

    // ==================== STOCK EVENTS ====================

    private async handleStockConsumed(event: IDomainEvent): Promise<void> {
        logger.debug('Stock consumed event received', { eventId: event.eventId });

        await this.debouncedRefresh('stock_forecast', async () => {
            await this.forecastingService.invalidateCache('stock_consumption');

            // Generate new recommendations
            const result = await this.recommendationService.generateRecommendations();
            if (result.success && result.data) {
                const criticalRecs = result.data.recommendations.filter(
                    r => r.priority === 'critical'
                );

                // Publish event if critical recommendations
                if (criticalRecs.length > 0) {
                    await this.publishRecommendationEvent(criticalRecs.length);
                }
            }
        });
    }

    private async handleStockReserved(event: IDomainEvent): Promise<void> {
        logger.debug('Stock reserved event received', { eventId: event.eventId });

        await this.debouncedRefresh('stock_recommendations', async () => {
            await this.recommendationService.generateRecommendations();
        });
    }

    // ==================== PRODUCTION EVENTS ====================

    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        logger.debug('Production completed event received', { eventId: event.eventId });

        await this.debouncedRefresh('production_analytics', async () => {
            // Invalidate production and waste forecasts
            await this.forecastingService.invalidateCache('production');
            await this.forecastingService.invalidateCache('waste');

            // Run anomaly detection
            const anomalyResult = await this.anomalyService.detectAnomalies();
            if (anomalyResult.success && anomalyResult.data) {
                const highSeverity = anomalyResult.data.anomalies.filter(
                    a => a.severity === 'high' || a.severity === 'critical'
                );

                // Publish event if high severity anomalies
                if (highSeverity.length > 0) {
                    await this.publishAnomalyEvent(highSeverity);
                }
            }
        });
    }

    // ==================== OPTIMIZATION EVENTS ====================

    private async handleOptimizationCompleted(event: IDomainEvent): Promise<void> {
        logger.debug('Optimization completed event received', { eventId: event.eventId });

        await this.debouncedRefresh('optimization_analytics', async () => {
            // Refresh recommendations (optimization may affect capacity suggestions)
            await this.recommendationService.generateRecommendations();
        });
    }

    // ==================== HELPERS ====================

    /**
     * Debounced refresh to prevent excessive analytics updates
     */
    private async debouncedRefresh(key: string, action: () => Promise<void>): Promise<void> {
        const now = Date.now();
        let state = this.debounceState.get(key);

        if (!state) {
            state = { lastRefresh: 0, pendingRefresh: null };
            this.debounceState.set(key, state);
        }

        // If we recently refreshed, schedule for later
        if (now - state.lastRefresh < DEBOUNCE_MS) {
            if (state.pendingRefresh) {
                clearTimeout(state.pendingRefresh);
            }

            state.pendingRefresh = setTimeout(async () => {
                state!.lastRefresh = Date.now();
                state!.pendingRefresh = null;
                try {
                    await action();
                } catch (error) {
                    logger.error('Debounced analytics refresh failed', { key, error });
                }
            }, DEBOUNCE_MS);

            return;
        }

        // Execute immediately
        state.lastRefresh = now;
        try {
            await action();
        } catch (error) {
            logger.error('Analytics refresh failed', { key, error });
        }
    }

    /**
     * Publish anomaly detection event via EventBus
     */
    private async publishAnomalyEvent(anomalies: Array<{ id: string; type: string; severity: string; metric: string }>): Promise<void> {
        try {
            const eventBus = EventBus.getInstance();
            await eventBus.publishTyped(
                AnalyticsEventTypes.ANOMALY_DETECTED,
                'Analytics',
                'anomaly-detection',
                {
                    count: anomalies.length,
                    anomalies: anomalies.map(a => ({
                        id: a.id,
                        type: a.type,
                        severity: a.severity,
                        metric: a.metric
                    }))
                }
            );
            logger.info('Anomaly event published', { count: anomalies.length });
        } catch (error) {
            logger.warn('Failed to publish anomaly event', { error });
        }
    }

    /**
     * Publish recommendation event via EventBus
     */
    private async publishRecommendationEvent(count: number): Promise<void> {
        try {
            const eventBus = EventBus.getInstance();
            await eventBus.publishTyped(
                AnalyticsEventTypes.RECOMMENDATION_CREATED,
                'Analytics',
                'recommendations',
                {
                    count,
                    message: `${count} yeni kritik öneri mevcut`
                }
            );
            logger.info('Recommendation event published', { count });
        } catch (error) {
            logger.warn('Failed to publish recommendation event', { error });
        }
    }
}
