/**
 * Request Aggregator
 * Aggregates multiple API calls into single responses
 * Following Backend-for-Frontend (BFF) Pattern
 */
import { Request, Router } from 'express';
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
    results: Record<string, {
        success: boolean;
        status: number;
        data?: unknown;
        error?: string;
    }>;
    meta: {
        totalRequests: number;
        successCount: number;
        failedCount: number;
        duration: number;
    };
}
export declare class RequestAggregator {
    private readonly handlers;
    /**
     * Register a handler for a path
     */
    registerHandler(path: string, handler: (req: Request) => Promise<unknown>): void;
    /**
     * Execute aggregate request
     */
    aggregate(requests: IAggregateRequest[]): Promise<IAggregateResponse>;
    /**
     * Sort requests by dependencies (topological sort)
     */
    private topologicalSort;
    /**
     * Create mock request from aggregate request
     */
    private createMockRequest;
}
export declare function getAggregator(): RequestAggregator;
/**
 * Aggregate endpoint middleware
 * POST /api/aggregate
 */
export declare function aggregateRouter(): Router;
//# sourceMappingURL=aggregator.d.ts.map