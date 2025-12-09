/**
 * Event Subscriptions Bootstrap
 * Registers all module event handlers at application startup
 * This is the central point for event-driven communication setup
 */
export interface EventHandlerDependencies {
    stockRepository: unknown;
    optimizationRepository: unknown;
    orderRepository: unknown;
}
export interface IEventHandlerRegistry {
    handlers: unknown[];
    cleanup: () => void;
}
/**
 * Factory function type for creating event handlers
 * Each module exports its own factory
 */
export type EventHandlerFactory = (deps: EventHandlerDependencies) => IEventHandlerRegistry;
//# sourceMappingURL=event-subscriptions.d.ts.map