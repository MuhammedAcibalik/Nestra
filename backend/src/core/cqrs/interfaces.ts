/**
 * CQRS (Command Query Responsibility Segregation) Core
 *
 * Provides type-safe command and query handling infrastructure
 * Following SOLID principles - especially SRP and ISP
 */

// ==================== COMMAND INTERFACES ====================

/**
 * Base interface for all commands
 * Commands modify state and return void or a result
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ICommand<TResult = void> {
    // Marker interface - TResult is used by handlers
}

/**
 * Handler for a specific command type
 */
export interface ICommandHandler<TCommand extends ICommand<TResult>, TResult = void> {
    execute(command: TCommand): Promise<TResult>;
}

// ==================== QUERY INTERFACES ====================

/**
 * Base interface for all queries
 * Queries read state and return data
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IQuery<TResult> {
    // Marker interface - TResult is used by handlers
}

/**
 * Handler for a specific query type
 */
export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
    execute(query: TQuery): Promise<TResult>;
}

// ==================== BUS INTERFACES ====================

/**
 * Command Bus - routes commands to their handlers
 */
export interface ICommandBus {
    execute<TResult>(command: ICommand<TResult>): Promise<TResult>;
    register<TCommand extends ICommand<TResult>, TResult>(
        commandType: new (...args: unknown[]) => TCommand,
        handler: ICommandHandler<TCommand, TResult>
    ): void;
}

/**
 * Query Bus - routes queries to their handlers
 */
export interface IQueryBus {
    execute<TResult>(query: IQuery<TResult>): Promise<TResult>;
    register<TQuery extends IQuery<TResult>, TResult>(
        queryType: new (...args: unknown[]) => TQuery,
        handler: IQueryHandler<TQuery, TResult>
    ): void;
}

// ==================== RESULT TYPES ====================

/**
 * Standard command result for operations that may fail
 */
export interface ICommandResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
}

/**
 * Paginated query result
 */
export interface IPaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ==================== METADATA ====================

/**
 * Command metadata for tracing and audit
 */
export interface ICommandMetadata {
    userId?: string;
    tenantId?: string;
    correlationId?: string;
    timestamp?: Date;
}

/**
 * Query metadata
 */
export interface IQueryMetadata {
    userId?: string;
    tenantId?: string;
    correlationId?: string;
}
