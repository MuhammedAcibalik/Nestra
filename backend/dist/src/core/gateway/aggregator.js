"use strict";
/**
 * Request Aggregator
 * Aggregates multiple API calls into single responses
 * Following Backend-for-Frontend (BFF) Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestAggregator = void 0;
exports.getAggregator = getAggregator;
exports.aggregateRouter = aggregateRouter;
const express_1 = require("express");
const logger_1 = require("../logger");
const api_1 = require("@opentelemetry/api");
const logger = (0, logger_1.createModuleLogger)('Aggregator');
const tracer = api_1.trace.getTracer('gateway', '1.0.0');
// ==================== AGGREGATOR SERVICE ====================
class RequestAggregator {
    handlers = new Map();
    /**
     * Register a handler for a path
     */
    registerHandler(path, handler) {
        this.handlers.set(path, handler);
        logger.debug('Handler registered', { path });
    }
    /**
     * Execute aggregate request
     */
    async aggregate(requests) {
        const startTime = Date.now();
        const results = {};
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
                if (req.dependsOn?.some(dep => !results[dep]?.success)) {
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
                }
                catch (error) {
                    results[req.key] = {
                        success: false,
                        status: 500,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    failedCount++;
                }
            }
            span.setStatus({ code: api_1.SpanStatusCode.OK });
        }
        catch (error) {
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Aggregation failed'
            });
            throw error;
        }
        finally {
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
    topologicalSort(requests) {
        const sorted = [];
        const visited = new Set();
        const requestMap = new Map(requests.map(r => [r.key, r]));
        const visit = (key) => {
            if (visited.has(key))
                return;
            visited.add(key);
            const req = requestMap.get(key);
            if (!req)
                return;
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
    createMockRequest(aggReq, previousResults) {
        return {
            method: aggReq.method ?? 'GET',
            path: aggReq.path,
            body: aggReq.body,
            query: aggReq.query ?? {},
            params: {},
            get: () => undefined,
            // Expose previous results for dynamic references
            aggregateContext: previousResults
        };
    }
}
exports.RequestAggregator = RequestAggregator;
// ==================== MIDDLEWARE ====================
let aggregatorInstance = null;
function getAggregator() {
    aggregatorInstance ??= new RequestAggregator();
    return aggregatorInstance;
}
/**
 * Aggregate endpoint middleware
 * POST /api/aggregate
 */
function aggregateRouter() {
    const router = (0, express_1.Router)();
    const aggregator = getAggregator();
    router.post('/aggregate', async (req, res, next) => {
        try {
            const requests = req.body.requests;
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
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=aggregator.js.map