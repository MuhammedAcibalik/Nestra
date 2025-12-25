"use strict";
/**
 * Query Bus Implementation
 * Routes queries to their registered handlers
 * Following Single Responsibility Principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBus = void 0;
exports.getQueryBus = getQueryBus;
exports.initializeQueryBus = initializeQueryBus;
const logger_1 = require("../logger");
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const logger = (0, logger_1.createModuleLogger)('QueryBus');
const tracer = api_1.trace.getTracer('cqrs', '1.0.0');
// ==================== QUERY BUS ====================
class QueryBus {
    handlers = new Map();
    enableTracing;
    constructor(options) {
        this.enableTracing = options?.enableTracing ?? true;
    }
    /**
     * Register a handler for a query type
     */
    register(queryType, handler) {
        const queryName = queryType.name;
        if (this.handlers.has(queryName)) {
            logger.warn('Overwriting existing handler', { query: queryName });
        }
        this.handlers.set(queryName, handler);
        logger.debug('Handler registered', { query: queryName });
    }
    /**
     * Execute a query
     */
    async execute(query) {
        const queryName = query.constructor.name;
        const handler = this.handlers.get(queryName);
        if (!handler) {
            throw new Error(`No handler registered for query: ${queryName}`);
        }
        if (!this.enableTracing) {
            return handler.execute(query);
        }
        // Trace the query execution
        const span = tracer.startSpan(`query.${queryName}`, {
            attributes: {
                'cqrs.type': 'query',
                'cqrs.query': queryName
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await handler.execute(query);
                span.setAttribute('cqrs.duration_ms', Date.now() - startTime);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                // Add result metadata for arrays
                if (Array.isArray(result)) {
                    span.setAttribute('cqrs.result_count', result.length);
                }
                logger.debug('Query executed', { query: queryName, duration: Date.now() - startTime });
                return result;
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(semantic_conventions_1.ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Query failed', { query: queryName, error });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Check if a handler is registered for a query type
     */
    hasHandler(queryType) {
        return this.handlers.has(queryType.name);
    }
    /**
     * Get all registered query names
     */
    getRegisteredQueries() {
        return Array.from(this.handlers.keys());
    }
}
exports.QueryBus = QueryBus;
// ==================== SINGLETON ====================
let queryBusInstance = null;
function getQueryBus() {
    queryBusInstance ??= new QueryBus();
    return queryBusInstance;
}
function initializeQueryBus(options) {
    queryBusInstance = new QueryBus(options);
    return queryBusInstance;
}
//# sourceMappingURL=query-bus.js.map