/**
 * Application Configuration
 * Type-safe environment configuration with validation
 * Following Microservice Pattern: Externalized Configuration
 */
type NodeEnv = 'development' | 'production' | 'test';
interface IServerConfig {
    readonly port: number;
    readonly host: string;
    readonly nodeEnv: NodeEnv;
    readonly apiPrefix: string;
    readonly corsOrigins: readonly string[];
}
interface IDatabaseConfig {
    readonly url: string;
    readonly poolMin: number;
    readonly poolMax: number;
    readonly logQueries: boolean;
}
interface IRabbitMQConfig {
    readonly enabled: boolean;
    readonly url: string;
    readonly exchange: string;
    readonly prefetch: number;
    readonly retryDelay: number;
    readonly maxRetries: number;
}
interface IPiscinaConfig {
    readonly minThreads: number;
    readonly maxThreads: number;
    readonly idleTimeout: number;
    readonly maxQueue: number;
}
interface IRateLimitConfig {
    readonly windowMs: number;
    readonly maxRequests: number;
    readonly authMaxRequests: number;
    readonly optimizationMaxRequests: number;
}
interface IJwtConfig {
    readonly secret: string;
    readonly expiresIn: string;
    readonly refreshExpiresIn: string;
}
interface IFeatureFlags {
    readonly enableRabbitMQ: boolean;
    readonly enableMetrics: boolean;
    readonly enableHealthChecks: boolean;
    readonly enableRateLimiting: boolean;
    readonly enableSecurityHeaders: boolean;
}
export interface IAppConfig {
    readonly server: IServerConfig;
    readonly database: IDatabaseConfig;
    readonly rabbitmq: IRabbitMQConfig;
    readonly piscina: IPiscinaConfig;
    readonly rateLimit: IRateLimitConfig;
    readonly jwt: IJwtConfig;
    readonly features: IFeatureFlags;
}
export declare function getConfig(): IAppConfig;
export declare function validateAndGetConfig(): IAppConfig;
export declare function isDevelopment(): boolean;
export declare function isProduction(): boolean;
export declare function isTest(): boolean;
export {};
//# sourceMappingURL=app.config.d.ts.map