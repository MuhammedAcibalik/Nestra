/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 * Following Microservice Pattern: API Gateway, Defense in Depth
 */
/**
 * Default rate limiter - General API endpoints
 * 100 requests per 15 minutes per IP
 */
export declare const defaultRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Auth rate limiter - Login/Register endpoints
 * 10 requests per 15 minutes per IP (stricter for security)
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * API rate limiter - General API with higher limit
 * 500 requests per 15 minutes per IP
 */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Optimization rate limiter - CPU intensive operations
 * 20 requests per 15 minutes per IP
 */
export declare const optimizationRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Upload rate limiter - File upload endpoints
 * 50 requests per hour per IP
 */
export declare const uploadRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Analytics rate limiter - Forecast/Reports endpoints
 * 60 requests per 15 minutes per IP (moderate - read operations)
 */
export declare const analyticsRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Analytics generation rate limiter - CPU intensive analytics operations
 * detect/generate endpoints - 10 requests per 15 minutes per IP
 */
export declare const analyticsGenerationRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rate-limit.middleware.d.ts.map