/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * Simplified entry point using modular bootstrap configuration
 */
/**
 * Application class - Single Responsibility: Application lifecycle management
 */
export declare class Application {
    private readonly app;
    private readonly httpServer;
    private readonly db;
    private readonly port;
    private services;
    constructor();
    /**
     * Connect to database
     */
    private connectDatabase;
    /**
     * Start the application
     */
    start(): Promise<void>;
    /**
     * Initialize job queue with optimization processor
     */
    private initializeJobQueue;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
declare const app: Application;
export default app;
//# sourceMappingURL=index.d.ts.map