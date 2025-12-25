/**
 * Advanced Features Configuration
 * Centralized config for Rate Limiting, Audit, Notifications, API Versioning
 * Following Single Source of Truth principle
 */
export interface IRateLimitEnvConfig {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    redisUrl?: string;
}
export declare function getRateLimitEnvConfig(): IRateLimitEnvConfig;
export interface IAuditEnvConfig {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'all' | 'write' | 'critical';
}
export declare function getAuditEnvConfig(): IAuditEnvConfig;
export type EmailProvider = 'smtp' | 'sendgrid' | 'ses';
export interface IEmailConfig {
    provider: EmailProvider;
    from: string;
    fromName: string;
    smtp?: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };
    sendgrid?: {
        apiKey: string;
    };
    ses?: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
}
export declare function getEmailConfig(): IEmailConfig;
export interface IApiVersionConfig {
    defaultVersion: number;
    currentVersion: number;
    latestVersion: number;
    deprecationEnabled: boolean;
    supportedVersions: number[];
}
export declare function getApiVersionConfig(): IApiVersionConfig;
export interface IAdvancedFeaturesConfig {
    rateLimit: IRateLimitEnvConfig;
    audit: IAuditEnvConfig;
    email: IEmailConfig;
    apiVersion: IApiVersionConfig;
}
export declare function getAdvancedFeaturesConfig(): IAdvancedFeaturesConfig;
/**
 * Reset cached config (useful for testing)
 */
export declare function resetConfigCache(): void;
//# sourceMappingURL=advanced-features.config.d.ts.map