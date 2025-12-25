/**
 * Request Aggregator
 * Aggregates multiple API calls into single responses
 * Following Backend-for-Frontend (BFF) Pattern
 */

import { Request, Response, NextFunction, Router } from 'express';
import { createModuleLogger } from '../logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const logger = createModuleLogger('Aggregator');
const tracer = trace.getTracer('gateway', '1.0.0');

// ==================== INTERFACES ====================

export interface IAggregateRequest {
    /** Unique key for this request in the response */
    key: string;
    /** Internal path to call */
    path: string;
    /** HTTP method */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    /** Request body for POST/PUT */
    body?: unknown;
    /** Query parameters */
    query?: Record<string, string>;
    /** Dependencies - keys that must complete first */
    dependsOn?: string[];
}

export interface IAggregateResponse {
    success: boolean;
    results: Record<
        string,
        {
            success: boolean;
            status: number;
            data?: unknown;
            error?: string;
        }
    >;
    meta: {
        totalRequests: number;
        successCount: number;
        failedCount: number;
        duration: number;
    };
}

// ==================== AGGREGATOR SERVICE ====================

export class RequestAggregator {
    private readonly handlers: Map<string, (req: Request) => Promise<unknown>> = new Map();

    /**
     * Register a handler for a path
     */
    registerHandler(path: string, handler: (req: Request) => Promise<unknown>): void {
        this.handlers.set(path, handler);
        logger.debug('Handler registered', { path });
    }

    /**
     * Execute aggregate request
     */
    async aggregate(requests: IAggregateRequest[]): Promise<IAggregateResponse> {
        const startTime = Date.now();
        const results: IAggregateResponse['results'] = {};
        let successCount = 0;
        let failedCount = 0;

        const span = tracer.startSpan('gateway.aggregate', {
            attributes: {
                'aggregate.request_count': requests.length
            }
        });

        try {
            // Sort by dependencies
            const sortedRequests = this.topologicalSort(requests);

            for (const req of sortedRequests) {
                // Check dependencies
                if (req.dependsOn?.some((dep) => !results[dep]?.success)) {
                    results[req.key] = {
                        success: false,
                        status: 424, // Failed Dependency
                        error: 'Dependency failed'
                    };
                    failedCount++;
                    continue;
                }

                try {
                    const handler = this.handlers.get(req.path);
                    if (!handler) {
                        results[req.key] = {
                            success: false,
                            status: 404,
                            error: `No handler for path: ${req.path}`
                        };
                        failedCount++;
                        continue;
                    }

                    // Create mock request
                    const mockReq = this.createMockRequest(req, results);
                    const data = await handler(mockReq);

                    results[req.key] = {
                        success: true,
                        status: 200,
                        data
                    };
                    successCount++;
                } catch (error) {
                    results[req.key] = {
                        success: false,
                        status: 500,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    failedCount++;
                }
            }

            span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Aggregation failed'
            });
            throw error;
        } finally {
            span.end();
        }

        return {
            success: failedCount === 0,
            results,
            meta: {
                totalRequests: requests.length,
                successCount,
                failedCount,
                duration: Date.now() - startTime
            }
        };
    }

    /**
     * Sort requests by dependencies (topological sort)
     */
    private topologicalSort(requests: IAggregateRequest[]): IAggregateRequest[] {
        const sorted: IAggregateRequest[] = [];
        const visited = new Set<string>();
        const requestMap = new Map(requests.map((r) => [r.key, r]));

        const visit = (key: string) => {
            if (visited.has(key)) return;
            visited.add(key);

            const req = requestMap.get(key);
            if (!req) return;

            for (const dep of req.dependsOn ?? []) {
                visit(dep);
            }

            sorted.push(req);
        };

        for (const req of requests) {
            visit(req.key);
        }

        return sorted;
    }

    /**
     * Create mock request from aggregate request
     */
    private createMockRequest(aggReq: IAggregateRequest, previousResults: Record<string, { data?: unknown }>): Request {
        return {
            method: aggReq.method ?? 'GET',
            path: aggReq.path,
            body: aggReq.body,
            query: aggReq.query ?? {},
            params: {},
            get: () => undefined,
            // Expose previous results for dynamic references
            aggregateContext: previousResults
        } as unknown as Request;
    }
}

// ==================== MIDDLEWARE ====================

let aggregatorInstance: RequestAggregator | null = null;

export function getAggregator(): RequestAggregator {
    aggregatorInstance ??= new RequestAggregator();
    return aggregatorInstance;
}

/**
 * Aggregate endpoint middleware
 * POST /api/aggregate
 */
export function aggregateRouter(): Router {
    const router = Router();
    const aggregator = getAggregator();

    router.post('/aggregate', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const requests = req.body.requests as IAggregateRequest[];

            if (!Array.isArray(requests) || requests.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'requests array is required'
                });
                return;
            }

            if (requests.length > 10) {
                res.status(400).json({
                    success: false,
                    error: 'Maximum 10 requests per aggregate call'
                });
                return;
            }

            const result = await aggregator.aggregate(requests);
            res.status(result.success ? 200 : 207).json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
}
