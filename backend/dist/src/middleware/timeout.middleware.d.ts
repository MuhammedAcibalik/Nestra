/**
 * Timeout Middleware
 * Prevents long-running requests from blocking resources
 * Following Microservice Pattern: Fail-Fast, Resource Management
 */
import { Request, Response, NextFunction } from 'express';
interface ITimeoutConfig {
    readonly defaultTimeoutMs: number;
    readonly optimizationTimeoutMs: number;
    readonly uploadTimeoutMs: number;
}
declare const timeoutConfig: ITimeoutConfig;
/**
 * Creates timeout middleware with configurable duration
 */
export declare function createTimeoutMiddleware(timeoutMs?: number): (req: Request, res: Response, next: NextFunction) => void;
export declare const defaultTimeout: (req: Request, res: Response, next: NextFunction) => void;
export declare const optimizationTimeout: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadTimeout: (req: Request, res: Response, next: NextFunction) => void;
export { timeoutConfig };
//# sourceMappingURL=timeout.middleware.d.ts.map