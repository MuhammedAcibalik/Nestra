/**
 * Enhanced Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Properly typed, singleton-aware, factory-based registration
 */
type Constructor<T> = new (...args: unknown[]) => T;
type Factory<T> = () => T;
type FactoryWithDeps<T> = (container: DIContainer) => T;
export declare class DIContainer {
    private readonly bindings;
    private readonly aliases;
    /**
     * Bind a class constructor to a token
     */
    bind<T>(token: string | symbol, implementation: Constructor<T>, singleton?: boolean): void;
    /**
     * Bind a factory function to a token
     */
    bindFactory<T>(token: string | symbol, factory: Factory<T>, singleton?: boolean): void;
    /**
     * Bind a factory that receives the container for dependency resolution
     */
    bindFactoryWithDeps<T>(token: string | symbol, factory: FactoryWithDeps<T>, singleton?: boolean): void;
    /**
     * Register as singleton
     */
    singleton<T>(token: string | symbol, implementation: Constructor<T>): void;
    /**
     * Register an existing instance
     */
    instance<T>(token: string | symbol, value: T): void;
    /**
     * Create an alias for a token
     */
    alias(alias: string | symbol, target: string | symbol): void;
    /**
     * Resolve a dependency by token
     */
    resolve<T>(token: string | symbol): T;
    /**
     * Check if a token is registered
     */
    has(token: string | symbol): boolean;
    /**
     * Remove a binding
     */
    unbind(token: string | symbol): void;
    /**
     * Clear all bindings
     */
    clear(): void;
    /**
     * Get all registered tokens
     */
    getTokens(): (string | symbol)[];
}
export declare const TOKENS: {
    readonly Database: symbol;
    readonly MaterialRepository: symbol;
    readonly StockRepository: symbol;
    readonly OrderRepository: symbol;
    readonly OptimizationRepository: symbol;
    readonly ProductionRepository: symbol;
    readonly ReportRepository: symbol;
    readonly CuttingJobRepository: symbol;
    readonly MachineRepository: symbol;
    readonly CustomerRepository: symbol;
    readonly LocationRepository: symbol;
    readonly ImportRepository: symbol;
    readonly TenantRepository: symbol;
    readonly DashboardRepository: symbol;
    readonly CollaborationRepository: symbol;
    readonly AuditRepository: symbol;
    readonly UserRepository: symbol;
    readonly MaterialService: symbol;
    readonly StockService: symbol;
    readonly AuthService: symbol;
    readonly OrderService: symbol;
    readonly OptimizationService: symbol;
    readonly ProductionService: symbol;
    readonly ReportService: symbol;
    readonly CuttingJobService: symbol;
    readonly ImportService: symbol;
    readonly MachineService: symbol;
    readonly CustomerService: symbol;
    readonly LocationService: symbol;
    readonly TenantService: symbol;
    readonly DashboardService: symbol;
    readonly PresenceService: symbol;
    readonly DocumentLockService: symbol;
    readonly ActivityFeedService: symbol;
    readonly AuditService: symbol;
    readonly NotificationService: symbol;
    readonly OptimizationHandler: symbol;
    readonly StockHandler: symbol;
    readonly OrderHandler: symbol;
    readonly MaterialHandler: symbol;
    readonly MachineHandler: symbol;
    readonly CustomerHandler: symbol;
    readonly CuttingJobHandler: symbol;
    readonly AuthHandler: symbol;
    readonly LocationHandler: symbol;
    readonly OptimizationClient: symbol;
    readonly StockClient: symbol;
    readonly CuttingJobClient: symbol;
    readonly StockQueryClient: symbol;
    readonly EventPublisher: symbol;
    readonly EventSubscriber: symbol;
    readonly Logger: symbol;
    readonly CacheService: symbol;
    readonly ServiceRegistry: symbol;
    readonly AuthConfig: symbol;
};
export type TokenKey = (typeof TOKENS)[keyof typeof TOKENS];
export declare const container: DIContainer;
/**
 * Type-safe resolve helper
 */
export declare function resolve<T>(token: symbol): T;
/**
 * Check if token is registered
 */
export declare function isRegistered(token: symbol): boolean;
export {};
//# sourceMappingURL=container.d.ts.map