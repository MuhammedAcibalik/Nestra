/**
 * Query Bus Implementation
 * Routes queries to their registered handlers
 * Following Single Responsibility Principle
 */

import { IQuery, IQueryHandler, IQueryBus } from './interfaces';
import { createModuleLogger } from '../logger';
import { trace, SpanStatusCode, context as otelContext } from '@opentelemetry/api';
import { ATTR_ERROR_TYPE } from '@opentelemetry/semantic-conventions';

const logger = createModuleLogger('QueryBus');
const tracer = trace.getTracer('cqrs', '1.0.0');

// ==================== QUERY BUS ====================

export class QueryBus implements IQueryBus {
    private readonly handlers: Map<string, IQueryHandler<IQuery<unknown>, unknown>> = new Map();
    private readonly enableTracing: boolean;

    constructor(options?: { enableTracing?: boolean }) {
        this.enableTracing = options?.enableTracing ?? true;
    }

    /**
     * Register a handler for a query type
     */
    register<TQuery extends IQuery<TResult>, TResult>(
        queryType: new (...args: unknown[]) => TQuery,
        handler: IQueryHandler<TQuery, TResult>
    ): void {
        const queryName = queryType.name;

        if (this.handlers.has(queryName)) {
            logger.warn('Overwriting existing handler', { query: queryName });
        }

        this.handlers.set(queryName, handler as IQueryHandler<IQuery<unknown>, unknown>);
        logger.debug('Handler registered', { query: queryName });
    }

    /**
     * Execute a query
     */
    async execute<TResult>(query: IQuery<TResult>): Promise<TResult> {
        const queryName = query.constructor.name;
        const handler = this.handlers.get(queryName);

        if (!handler) {
            throw new Error(`No handler registered for query: ${queryName}`);
        }

        if (!this.enableTracing) {
            return handler.execute(query) as Promise<TResult>;
        }

        // Trace the query execution
        const span = tracer.startSpan(`query.${queryName}`, {
            attributes: {
                'cqrs.type': 'query',
                'cqrs.query': queryName
            }
        });

        return otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await handler.execute(query);

                span.setAttribute('cqrs.duration_ms', Date.now() - startTime);
                span.setStatus({ code: SpanStatusCode.OK });

                // Add result metadata for arrays
                if (Array.isArray(result)) {
                    span.setAttribute('cqrs.result_count', result.length);
                }

                logger.debug('Query executed', { query: queryName, duration: Date.now() - startTime });
                return result as TResult;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Query failed', { query: queryName, error });
                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Check if a handler is registered for a query type
     */
    hasHandler(queryType: new (...args: unknown[]) => IQuery<unknown>): boolean {
        return this.handlers.has(queryType.name);
    }

    /**
     * Get all registered query names
     */
    getRegisteredQueries(): string[] {
        return Array.from(this.handlers.keys());
    }
}

// ==================== SINGLETON ====================

let queryBusInstance: QueryBus | null = null;

export function getQueryBus(): QueryBus {
    queryBusInstance ??= new QueryBus();
    return queryBusInstance;
}

export function initializeQueryBus(options?: { enableTracing?: boolean }): QueryBus {
    queryBusInstance = new QueryBus(options);
    return queryBusInstance;
}
