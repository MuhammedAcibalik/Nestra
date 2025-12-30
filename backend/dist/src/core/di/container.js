"use strict";
/**
 * Enhanced Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Properly typed, singleton-aware, factory-based registration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = exports.TOKENS = exports.DIContainer = void 0;
exports.resolve = resolve;
exports.isRegistered = isRegistered;
// ==================== DI CONTAINER ====================
class DIContainer {
    bindings = new Map();
    aliases = new Map();
    /**
     * Bind a class constructor to a token
     */
    bind(token, implementation, singleton = false) {
        this.bindings.set(token, { implementation, singleton, useContainer: false });
    }
    /**
     * Bind a factory function to a token
     */
    bindFactory(token, factory, singleton = false) {
        this.bindings.set(token, { implementation: factory, singleton, useContainer: false });
    }
    /**
     * Bind a factory that receives the container for dependency resolution
     */
    bindFactoryWithDeps(token, factory, singleton = true) {
        this.bindings.set(token, { implementation: factory, singleton, useContainer: true });
    }
    /**
     * Register as singleton
     */
    singleton(token, implementation) {
        this.bind(token, implementation, true);
    }
    /**
     * Register an existing instance
     */
    instance(token, value) {
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
    alias(alias, target) {
        this.aliases.set(alias, target);
    }
    /**
     * Resolve a dependency by token
     */
    resolve(token) {
        // Resolve alias chain
        let resolvedToken = token;
        while (this.aliases.has(resolvedToken)) {
            resolvedToken = this.aliases.get(resolvedToken);
        }
        const binding = this.bindings.get(resolvedToken);
        if (!binding) {
            throw new TypeError(`No binding found for ${String(token)}`);
        }
        // Return cached singleton
        if (binding.singleton && binding.instance !== undefined) {
            return binding.instance;
        }
        // Create instance
        let instance;
        const impl = binding.implementation;
        if (typeof impl === 'function') {
            if (binding.useContainer) {
                // Factory with container injection
                instance = impl(this);
            }
            else if (impl.prototype !== undefined && impl.prototype.constructor === impl) {
                // Constructor
                instance = new impl();
            }
            else {
                // Simple factory
                instance = impl();
            }
        }
        else {
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
    has(token) {
        return this.bindings.has(token) || this.aliases.has(token);
    }
    /**
     * Remove a binding
     */
    unbind(token) {
        this.bindings.delete(token);
        this.aliases.delete(token);
    }
    /**
     * Clear all bindings
     */
    clear() {
        this.bindings.clear();
        this.aliases.clear();
    }
    /**
     * Get all registered tokens
     */
    getTokens() {
        return Array.from(this.bindings.keys());
    }
}
exports.DIContainer = DIContainer;
// ==================== TOKENS ====================
exports.TOKENS = {
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
};
// ==================== GLOBAL CONTAINER ====================
exports.container = new DIContainer();
// ==================== RESOLUTION HELPERS ====================
/**
 * Type-safe resolve helper
 */
function resolve(token) {
    return exports.container.resolve(token);
}
/**
 * Check if token is registered
 */
function isRegistered(token) {
    return exports.container.has(token);
}
//# sourceMappingURL=container.js.map