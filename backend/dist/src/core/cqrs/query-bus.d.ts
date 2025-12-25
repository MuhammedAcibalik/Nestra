/**
 * Query Bus Implementation
 * Routes queries to their registered handlers
 * Following Single Responsibility Principle
 */
import { IQuery, IQueryHandler, IQueryBus } from './interfaces';
export declare class QueryBus implements IQueryBus {
    private readonly handlers;
    private readonly enableTracing;
    constructor(options?: {
        enableTracing?: boolean;
    });
    /**
     * Register a handler for a query type
     */
    register<TQuery extends IQuery<TResult>, TResult>(queryType: new (...args: unknown[]) => TQuery, handler: IQueryHandler<TQuery, TResult>): void;
    /**
     * Execute a query
     */
    execute<TResult>(query: IQuery<TResult>): Promise<TResult>;
    /**
     * Check if a handler is registered for a query type
     */
    hasHandler(queryType: new (...args: unknown[]) => IQuery<unknown>): boolean;
    /**
     * Get all registered query names
     */
    getRegisteredQueries(): string[];
}
export declare function getQueryBus(): QueryBus;
export declare function initializeQueryBus(options?: {
    enableTracing?: boolean;
}): QueryBus;
//# sourceMappingURL=query-bus.d.ts.map