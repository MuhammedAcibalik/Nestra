/**
 * Enhanced Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Properly typed, singleton-aware, factory-based registration
 */

// ==================== TYPE DEFINITIONS ====================

type Constructor<T> = new (...args: unknown[]) => T;
type Factory<T> = () => T;
type FactoryWithDeps<T> = (container: DIContainer) => T;

interface Binding<T> {
    implementation: Constructor<T> | Factory<T> | FactoryWithDeps<T>;
    singleton: boolean;
    instance?: T;
    useContainer: boolean;
}

// ==================== DI CONTAINER ====================

export class DIContainer {
    private readonly bindings = new Map<string | symbol, Binding<unknown>>();
    private readonly aliases = new Map<string | symbol, string | symbol>();

    /**
     * Bind a class constructor to a token
     */
    bind<T>(token: string | symbol, implementation: Constructor<T>, singleton = false): void {
        this.bindings.set(token, { implementation, singleton, useContainer: false });
    }

    /**
     * Bind a factory function to a token
     */
    bindFactory<T>(token: string | symbol, factory: Factory<T>, singleton = false): void {
        this.bindings.set(token, { implementation: factory, singleton, useContainer: false });
    }

    /**
     * Bind a factory that receives the container for dependency resolution
     */
    bindFactoryWithDeps<T>(
        token: string | symbol,
        factory: FactoryWithDeps<T>,
        singleton = true
    ): void {
        this.bindings.set(token, { implementation: factory, singleton, useContainer: true });
    }

    /**
     * Register as singleton
     */
    singleton<T>(token: string | symbol, implementation: Constructor<T>): void {
        this.bind(token, implementation, true);
    }

    /**
     * Register an existing instance
     */
    instance<T>(token: string | symbol, value: T): void {
        this.bindings.set(token, {
            implementation: () => value,
            singleton: true,
            instance: value,
            useContainer: false
        });
    }

    /**
     * Create an alias for a token
     */
    alias(alias: string | symbol, target: string | symbol): void {
        this.aliases.set(alias, target);
    }

    /**
     * Resolve a dependency by token
     */
    resolve<T>(token: string | symbol): T {
        // Resolve alias chain
        let resolvedToken = token;
        while (this.aliases.has(resolvedToken)) {
            resolvedToken = this.aliases.get(resolvedToken)!;
        }

        const binding = this.bindings.get(resolvedToken);
        if (!binding) {
            throw new TypeError(`No binding found for ${String(token)}`);
        }

        // Return cached singleton
        if (binding.singleton && binding.instance !== undefined) {
            return binding.instance as T;
        }

        // Create instance
        let instance: T;
        const impl = binding.implementation;

        if (typeof impl === 'function') {
            if (binding.useContainer) {
                // Factory with container injection
                instance = (impl as FactoryWithDeps<T>)(this);
            } else if (impl.prototype !== undefined && impl.prototype.constructor === impl) {
                // Constructor
                instance = new (impl as Constructor<T>)();
            } else {
                // Simple factory
                instance = (impl as Factory<T>)();
            }
        } else {
            throw new TypeError(`Invalid binding for ${String(token)}`);
        }

        // Cache singleton
        if (binding.singleton) {
            binding.instance = instance;
        }

        return instance;
    }

    /**
     * Check if a token is registered
     */
    has(token: string | symbol): boolean {
        return this.bindings.has(token) || this.aliases.has(token);
    }

    /**
     * Remove a binding
     */
    unbind(token: string | symbol): void {
        this.bindings.delete(token);
        this.aliases.delete(token);
    }

    /**
     * Clear all bindings
     */
    clear(): void {
        this.bindings.clear();
        this.aliases.clear();
    }

    /**
     * Get all registered tokens
     */
    getTokens(): (string | symbol)[] {
        return Array.from(this.bindings.keys());
    }
}

// ==================== TOKENS ====================

export const TOKENS = {
    // Database
    Database: Symbol('Database'),

    // Repositories
    MaterialRepository: Symbol('MaterialRepository'),
    StockRepository: Symbol('StockRepository'),
    OrderRepository: Symbol('OrderRepository'),
    OptimizationRepository: Symbol('OptimizationRepository'),
    ProductionRepository: Symbol('ProductionRepository'),
    ReportRepository: Symbol('ReportRepository'),
    CuttingJobRepository: Symbol('CuttingJobRepository'),
    MachineRepository: Symbol('MachineRepository'),
    CustomerRepository: Symbol('CustomerRepository'),
    LocationRepository: Symbol('LocationRepository'),
    ImportRepository: Symbol('ImportRepository'),
    TenantRepository: Symbol('TenantRepository'),
    DashboardRepository: Symbol('DashboardRepository'),
    CollaborationRepository: Symbol('CollaborationRepository'),
    AuditRepository: Symbol('AuditRepository'),
    UserRepository: Symbol('UserRepository'),

    // Services
    MaterialService: Symbol('MaterialService'),
    StockService: Symbol('StockService'),
    AuthService: Symbol('AuthService'),
    OrderService: Symbol('OrderService'),
    OptimizationService: Symbol('OptimizationService'),
    ProductionService: Symbol('ProductionService'),
    ReportService: Symbol('ReportService'),
    CuttingJobService: Symbol('CuttingJobService'),
    ImportService: Symbol('ImportService'),
    MachineService: Symbol('MachineService'),
    CustomerService: Symbol('CustomerService'),
    LocationService: Symbol('LocationService'),
    TenantService: Symbol('TenantService'),
    DashboardService: Symbol('DashboardService'),
    PresenceService: Symbol('PresenceService'),
    DocumentLockService: Symbol('DocumentLockService'),
    ActivityFeedService: Symbol('ActivityFeedService'),
    AuditService: Symbol('AuditService'),
    NotificationService: Symbol('NotificationService'),

    // Service Handlers (Microservice Pattern)
    OptimizationHandler: Symbol('OptimizationHandler'),
    StockHandler: Symbol('StockHandler'),
    OrderHandler: Symbol('OrderHandler'),
    MaterialHandler: Symbol('MaterialHandler'),
    MachineHandler: Symbol('MachineHandler'),
    CustomerHandler: Symbol('CustomerHandler'),
    CuttingJobHandler: Symbol('CuttingJobHandler'),
    AuthHandler: Symbol('AuthHandler'),
    LocationHandler: Symbol('LocationHandler'),

    // Service Clients
    OptimizationClient: Symbol('OptimizationClient'),
    StockClient: Symbol('StockClient'),
    CuttingJobClient: Symbol('CuttingJobClient'),
    StockQueryClient: Symbol('StockQueryClient'),

    // Infrastructure
    EventPublisher: Symbol('EventPublisher'),
    EventSubscriber: Symbol('EventSubscriber'),
    Logger: Symbol('Logger'),
    CacheService: Symbol('CacheService'),
    ServiceRegistry: Symbol('ServiceRegistry'),

    // Config
    AuthConfig: Symbol('AuthConfig')
} as const;

export type TokenKey = (typeof TOKENS)[keyof typeof TOKENS];

// ==================== GLOBAL CONTAINER ====================

export const container = new DIContainer();

// ==================== RESOLUTION HELPERS ====================

/**
 * Type-safe resolve helper
 */
export function resolve<T>(token: symbol): T {
    return container.resolve<T>(token);
}

/**
 * Check if token is registered
 */
export function isRegistered(token: symbol): boolean {
    return container.has(token);
}
