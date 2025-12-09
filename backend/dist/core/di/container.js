"use strict";
/**
 * Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Properly typed without any usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = exports.TOKENS = exports.container = void 0;
class Container {
    bindings = new Map();
    aliases = new Map();
    bind(token, implementation, singleton = false) {
        this.bindings.set(token, { implementation, singleton });
    }
    bindFactory(token, factory, singleton = false) {
        this.bindings.set(token, { implementation: factory, singleton });
    }
    singleton(token, implementation) {
        this.bind(token, implementation, true);
    }
    instance(token, instance) {
        this.bindings.set(token, {
            implementation: () => instance,
            singleton: true,
            instance
        });
    }
    alias(alias, target) {
        this.aliases.set(alias, target);
    }
    resolve(token) {
        if (this.aliases.has(token)) {
            token = this.aliases.get(token);
        }
        const binding = this.bindings.get(token);
        if (!binding) {
            throw new Error(`No binding found for ${String(token)}`);
        }
        if (binding.singleton && binding.instance !== undefined) {
            return binding.instance;
        }
        let instance;
        const impl = binding.implementation;
        if (typeof impl === 'function') {
            if (impl.prototype !== undefined && impl.prototype.constructor === impl) {
                instance = new impl();
            }
            else {
                instance = impl();
            }
        }
        else {
            throw new Error(`Invalid binding for ${String(token)}`);
        }
        if (binding.singleton) {
            binding.instance = instance;
        }
        return instance;
    }
    has(token) {
        return this.bindings.has(token) || this.aliases.has(token);
    }
    unbind(token) {
        this.bindings.delete(token);
        this.aliases.delete(token);
    }
    clear() {
        this.bindings.clear();
        this.aliases.clear();
    }
}
exports.Container = Container;
exports.container = new Container();
exports.TOKENS = {
    // Repositories
    MaterialRepository: Symbol('MaterialRepository'),
    StockRepository: Symbol('StockRepository'),
    OrderRepository: Symbol('OrderRepository'),
    OrderItemRepository: Symbol('OrderItemRepository'),
    CuttingJobRepository: Symbol('CuttingJobRepository'),
    ScenarioRepository: Symbol('ScenarioRepository'),
    CuttingPlanRepository: Symbol('CuttingPlanRepository'),
    ProductionLogRepository: Symbol('ProductionLogRepository'),
    UserRepository: Symbol('UserRepository'),
    RoleRepository: Symbol('RoleRepository'),
    CustomerRepository: Symbol('CustomerRepository'),
    MachineRepository: Symbol('MachineRepository'),
    StockMovementRepository: Symbol('StockMovementRepository'),
    WastePolicyRepository: Symbol('WastePolicyRepository'),
    // Services
    AuthService: Symbol('AuthService'),
    MaterialService: Symbol('MaterialService'),
    StockService: Symbol('StockService'),
    OrderService: Symbol('OrderService'),
    OptimizationService: Symbol('OptimizationService'),
    ProductionService: Symbol('ProductionService'),
    ReportService: Symbol('ReportService'),
    ConfigService: Symbol('ConfigService'),
    // Algorithms
    Optimizer1D: Symbol('Optimizer1D'),
    Optimizer2D: Symbol('Optimizer2D'),
    // Infrastructure
    EventPublisher: Symbol('EventPublisher'),
    EventSubscriber: Symbol('EventSubscriber'),
    Logger: Symbol('Logger'),
    CacheService: Symbol('CacheService'),
    // Database
    PrismaClient: Symbol('PrismaClient'),
    UnitOfWork: Symbol('UnitOfWork'),
};
//# sourceMappingURL=container.js.map