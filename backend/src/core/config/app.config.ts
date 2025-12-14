/**
 * Application Configuration
 * Type-safe environment configuration with validation
 * Following Microservice Pattern: Externalized Configuration
 */

// ==================== ENVIRONMENT TYPES ====================

type NodeEnv = 'development' | 'production' | 'test';

// ==================== CONFIG INTERFACES ====================

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

// ==================== ENVIRONMENT HELPERS ====================

/**
 * Get a required environment variable - throws if not set
 * Use for security-critical values like JWT_SECRET
 */
function getRequiredEnvString(key: string): string {
    const value = process.env[key];
    if (value === undefined || value.trim() === '') {
        throw new Error(`[CONFIG] Required environment variable ${key} is not set`);
    }
    return value;
}

function getEnvString(key: string, defaultValue: string): string {
    return process.env[key] ?? defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
}

function getEnvArray(key: string, defaultValue: readonly string[]): readonly string[] {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.split(',').map(s => s.trim());
}

function getNodeEnv(): NodeEnv {
    const env = process.env.NODE_ENV;
    if (env === 'production' || env === 'test') return env;
    return 'development';
}

// ==================== CONFIG BUILDER ====================

function buildConfig(): IAppConfig {
    return {
        server: {
            port: getEnvNumber('PORT', 3000),
            host: getEnvString('HOST', '0.0.0.0'),
            nodeEnv: getNodeEnv(),
            apiPrefix: getEnvString('API_PREFIX', '/api'),
            corsOrigins: getEnvArray('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:5173'])
        },

        database: {
            url: getEnvString('DATABASE_URL', ''),
            poolMin: getEnvNumber('DB_POOL_MIN', 2),
            poolMax: getEnvNumber('DB_POOL_MAX', 10),
            logQueries: getEnvBoolean('DB_LOG_QUERIES', false)
        },

        rabbitmq: {
            enabled: getEnvBoolean('USE_RABBITMQ', false),
            url: getEnvString('RABBITMQ_URL', 'amqp://localhost:5672'),
            exchange: getEnvString('RABBITMQ_EXCHANGE', 'nestra.events'),
            prefetch: getEnvNumber('RABBITMQ_PREFETCH', 10),
            retryDelay: getEnvNumber('RABBITMQ_RETRY_DELAY', 5000),
            maxRetries: getEnvNumber('RABBITMQ_MAX_RETRIES', 10)
        },

        piscina: {
            minThreads: getEnvNumber('PISCINA_MIN_THREADS', 4),
            maxThreads: getEnvNumber('PISCINA_MAX_THREADS', 12),
            idleTimeout: getEnvNumber('PISCINA_IDLE_TIMEOUT', 60000),
            maxQueue: getEnvNumber('PISCINA_MAX_QUEUE', 256)
        },

        rateLimit: {
            windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
            maxRequests: getEnvNumber('RATE_LIMIT_MAX', 100),
            authMaxRequests: getEnvNumber('RATE_LIMIT_AUTH_MAX', 10),
            optimizationMaxRequests: getEnvNumber('RATE_LIMIT_OPTIMIZATION_MAX', 20)
        },

        jwt: {
            secret: getRequiredEnvString('JWT_SECRET'),
            expiresIn: getEnvString('JWT_EXPIRES_IN', '1h'),
            refreshExpiresIn: getEnvString('JWT_REFRESH_EXPIRES_IN', '7d')
        },

        features: {
            enableRabbitMQ: getEnvBoolean('USE_RABBITMQ', false),
            enableMetrics: getEnvBoolean('ENABLE_METRICS', true),
            enableHealthChecks: getEnvBoolean('ENABLE_HEALTH_CHECKS', true),
            enableRateLimiting: getEnvBoolean('ENABLE_RATE_LIMITING', true),
            enableSecurityHeaders: getEnvBoolean('ENABLE_SECURITY_HEADERS', true)
        }
    };
}

// ==================== VALIDATION ====================

interface IValidationError {
    readonly field: string;
    readonly message: string;
}

function validateConfig(config: IAppConfig): readonly IValidationError[] {
    const errors: IValidationError[] = [];

    // Required in production
    if (config.server.nodeEnv === 'production') {
        if (!config.database.url) {
            errors.push({ field: 'database.url', message: 'DATABASE_URL is required in production' });
        }
        // NOTE: JWT_SECRET is now required at config load time (fails fast)
    }

    // Port validation
    if (config.server.port < 1 || config.server.port > 65535) {
        errors.push({ field: 'server.port', message: 'PORT must be between 1 and 65535' });
    }

    // Piscina validation
    if (config.piscina.minThreads > config.piscina.maxThreads) {
        errors.push({ field: 'piscina.minThreads', message: 'PISCINA_MIN_THREADS cannot exceed PISCINA_MAX_THREADS' });
    }

    return errors;
}

// ==================== SINGLETON CONFIG ====================

let appConfig: IAppConfig | null = null;

export function getConfig(): IAppConfig {
    appConfig ??= buildConfig();
    return appConfig;
}

export function validateAndGetConfig(): IAppConfig {
    const config = getConfig();
    const errors = validateConfig(config);

    if (errors.length > 0) {
        console.error('[CONFIG] Validation errors:');
        for (const error of errors) {
            console.error(`  - ${error.field}: ${error.message}`);
        }

        if (config.server.nodeEnv === 'production') {
            throw new Error('Configuration validation failed in production');
        }
    }

    return config;
}

export function isDevelopment(): boolean {
    return getConfig().server.nodeEnv === 'development';
}

export function isProduction(): boolean {
    return getConfig().server.nodeEnv === 'production';
}

export function isTest(): boolean {
    return getConfig().server.nodeEnv === 'test';
}
