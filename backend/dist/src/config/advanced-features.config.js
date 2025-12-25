"use strict";
/**
 * Advanced Features Configuration
 * Centralized config for Rate Limiting, Audit, Notifications, API Versioning
 * Following Single Source of Truth principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimitEnvConfig = getRateLimitEnvConfig;
exports.getAuditEnvConfig = getAuditEnvConfig;
exports.getEmailConfig = getEmailConfig;
exports.getApiVersionConfig = getApiVersionConfig;
exports.getAdvancedFeaturesConfig = getAdvancedFeaturesConfig;
exports.resetConfigCache = resetConfigCache;
function getRateLimitEnvConfig() {
    return {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
        maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
        redisUrl: process.env.REDIS_URL
    };
}
function getAuditEnvConfig() {
    return {
        enabled: process.env.AUDIT_ENABLED !== 'false',
        retentionDays: Number.parseInt(process.env.AUDIT_RETENTION_DAYS ?? '365', 10),
        logLevel: process.env.AUDIT_LOG_LEVEL ?? 'all'
    };
}
function getEmailConfig() {
    const provider = process.env.EMAIL_PROVIDER ?? 'smtp';
    const baseConfig = {
        provider,
        from: process.env.EMAIL_FROM ?? 'noreply@nestra.app',
        fromName: process.env.EMAIL_FROM_NAME ?? 'Nestra'
    };
    switch (provider) {
        case 'sendgrid':
            return {
                ...baseConfig,
                sendgrid: {
                    apiKey: process.env.SENDGRID_API_KEY ?? ''
                }
            };
        case 'ses':
            return {
                ...baseConfig,
                ses: {
                    region: process.env.AWS_REGION ?? 'eu-west-1',
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
                }
            };
        case 'smtp':
        default:
            return {
                ...baseConfig,
                smtp: {
                    host: process.env.SMTP_HOST ?? 'localhost',
                    port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10),
                    secure: process.env.SMTP_SECURE === 'true',
                    user: process.env.SMTP_USER ?? '',
                    pass: process.env.SMTP_PASS ?? ''
                }
            };
    }
}
function getApiVersionConfig() {
    const defaultVersion = Number.parseInt(process.env.API_DEFAULT_VERSION ?? '1', 10);
    const currentVersion = Number.parseInt(process.env.API_CURRENT_VERSION ?? '1', 10);
    const latestVersion = Number.parseInt(process.env.API_LATEST_VERSION ?? '2', 10);
    return {
        defaultVersion,
        currentVersion,
        latestVersion,
        deprecationEnabled: process.env.API_DEPRECATION_ENABLED !== 'false',
        supportedVersions: Array.from({ length: latestVersion - 1 + 1 }, (_, i) => i + 1)
    };
}
let cachedConfig = null;
function getAdvancedFeaturesConfig() {
    if (!cachedConfig) {
        cachedConfig = {
            rateLimit: getRateLimitEnvConfig(),
            audit: getAuditEnvConfig(),
            email: getEmailConfig(),
            apiVersion: getApiVersionConfig()
        };
    }
    return cachedConfig;
}
/**
 * Reset cached config (useful for testing)
 */
function resetConfigCache() {
    cachedConfig = null;
}
//# sourceMappingURL=advanced-features.config.js.map