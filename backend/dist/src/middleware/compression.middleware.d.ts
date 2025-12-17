/**
 * Compression Middleware
 * GZIP compression for responses
 * Following Microservice Pattern: Performance Optimization
 */
import { Request, Response } from 'express';
interface ICompressionConfig {
    readonly level: number;
    readonly threshold: number;
    readonly filter: (req: Request, res: Response) => boolean;
}
declare const compressionConfig: ICompressionConfig;
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export { compressionConfig };
//# sourceMappingURL=compression.middleware.d.ts.map