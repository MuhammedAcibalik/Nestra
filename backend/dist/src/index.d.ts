/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * All dependencies are wired up here at the composition root
 */
/**
 * Application class - Single Responsibility: Application lifecycle management
 */
export declare class Application {
    private readonly app;
    private readonly httpServer;
    private readonly db;
    private readonly port;
    private materialService;
    private stockService;
    private authService;
    private orderService;
    private optimizationService;
    private productionService;
    private reportService;
    private cuttingJobService;
    private importService;
    private machineService;
    private customerService;
    private locationService;
    constructor();
    /**
     * Initialize all dependencies - Composition Root
     */
    private initializeDependencies;
    /**
     * Initialize Express middleware
     */
    private initializeMiddleware;
    /**
     * Initialize routes with dependency injection
     */
    private initializeRoutes;
    /**
     * Initialize error handling
     */
    private initializeErrorHandling;
    /**
     * Connect to database
     */
    private connectDatabase;
    /**
     * Start the application
     */
    start(): Promise<void>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
declare const app: Application;
export default app;
//# sourceMappingURL=index.d.ts.map