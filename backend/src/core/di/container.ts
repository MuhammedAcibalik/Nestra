/**
 * Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Properly typed without any usage
 */

type Constructor<T> = new (...args: unknown[]) => T;
type Factory<T> = () => T;

interface Binding<T> {
    implementation: Constructor<T> | Factory<T>;
    singleton: boolean;
    instance?: T;
}

class Container {
    private readonly bindings: Map<string | symbol, Binding<unknown>> = new Map();
    private readonly aliases: Map<string | symbol, string | symbol> = new Map();

    bind<T>(token: string | symbol, implementation: Constructor<T>, singleton = false): void {
        this.bindings.set(token, { implementation, singleton });
    }

    bindFactory<T>(token: string | symbol, factory: Factory<T>, singleton = false): void {
        this.bindings.set(token, { implementation: factory, singleton });
    }

    singleton<T>(token: string | symbol, implementation: Constructor<T>): void {
        this.bind(token, implementation, true);
    }

    instance<T>(token: string | symbol, instance: T): void {
        this.bindings.set(token, {
            implementation: () => instance,
            singleton: true,
            instance
        });
    }

    alias(alias: string | symbol, target: string | symbol): void {
        this.aliases.set(alias, target);
    }

    resolve<T>(token: string | symbol): T {
        if (this.aliases.has(token)) {
            token = this.aliases.get(token)!;
        }

        const binding = this.bindings.get(token);
        if (!binding) {
            throw new TypeError(`No binding found for ${String(token)}`);
        }

        if (binding.singleton && binding.instance !== undefined) {
            return binding.instance as T;
        }

        let instance: T;
        const impl = binding.implementation;

        if (typeof impl === 'function') {
            if (impl.prototype !== undefined && impl.prototype.constructor === impl) {
                instance = new (impl as Constructor<T>)();
            } else {
                instance = (impl as Factory<T>)();
            }
        } else {
            throw new TypeError(`Invalid binding for ${String(token)}`);
        }

        if (binding.singleton) {
            binding.instance = instance;
        }

        return instance;
    }

    has(token: string | symbol): boolean {
        return this.bindings.has(token) || this.aliases.has(token);
    }

    unbind(token: string | symbol): void {
        this.bindings.delete(token);
        this.aliases.delete(token);
    }

    clear(): void {
        this.bindings.clear();
        this.aliases.clear();
    }
}

export const container = new Container();

export const TOKENS = {
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
} as const;

export { Container };
