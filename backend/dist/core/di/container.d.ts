/**
 * Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Properly typed without any usage
 */
type Constructor<T> = new (...args: unknown[]) => T;
type Factory<T> = () => T;
declare class Container {
    private bindings;
    private aliases;
    bind<T>(token: string | symbol, implementation: Constructor<T>, singleton?: boolean): void;
    bindFactory<T>(token: string | symbol, factory: Factory<T>, singleton?: boolean): void;
    singleton<T>(token: string | symbol, implementation: Constructor<T>): void;
    instance<T>(token: string | symbol, instance: T): void;
    alias(alias: string | symbol, target: string | symbol): void;
    resolve<T>(token: string | symbol): T;
    has(token: string | symbol): boolean;
    unbind(token: string | symbol): void;
    clear(): void;
}
export declare const container: Container;
export declare const TOKENS: {
    readonly MaterialRepository: symbol;
    readonly StockRepository: symbol;
    readonly OrderRepository: symbol;
    readonly OrderItemRepository: symbol;
    readonly CuttingJobRepository: symbol;
    readonly ScenarioRepository: symbol;
    readonly CuttingPlanRepository: symbol;
    readonly ProductionLogRepository: symbol;
    readonly UserRepository: symbol;
    readonly RoleRepository: symbol;
    readonly CustomerRepository: symbol;
    readonly MachineRepository: symbol;
    readonly StockMovementRepository: symbol;
    readonly WastePolicyRepository: symbol;
    readonly AuthService: symbol;
    readonly MaterialService: symbol;
    readonly StockService: symbol;
    readonly OrderService: symbol;
    readonly OptimizationService: symbol;
    readonly ProductionService: symbol;
    readonly ReportService: symbol;
    readonly ConfigService: symbol;
    readonly Optimizer1D: symbol;
    readonly Optimizer2D: symbol;
    readonly EventPublisher: symbol;
    readonly EventSubscriber: symbol;
    readonly Logger: symbol;
    readonly CacheService: symbol;
    readonly PrismaClient: symbol;
    readonly UnitOfWork: symbol;
};
export { Container };
//# sourceMappingURL=container.d.ts.map