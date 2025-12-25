/**
 * Enhanced Base Repository with OpenTelemetry Tracing
 * Example implementation using semantic conventions for database operations
 */
import { Database } from '../..';
import { FilterCondition } from './filter-builder';
export interface RepositoryConfig {
    tableName: string;
    enableTracing?: boolean;
}
export declare abstract class EnhancedBaseRepository<T> {
    protected readonly config: RepositoryConfig;
    protected readonly db: Database;
    protected readonly tableName: string;
    protected readonly enableTracing: boolean;
    constructor(db: Database, config: RepositoryConfig);
    /**
     * Find many with tracing
     */
    findMany(filter?: FilterCondition, limit?: number, offset?: number): Promise<T[]>;
    /**
     * Create with tracing
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update with tracing
     */
    update(id: string, data: Partial<T>): Promise<T>;
    /**
     * Delete with tracing
     */
    delete(id: string): Promise<void>;
    protected abstract findManyImpl(filter?: FilterCondition, limit?: number, offset?: number): Promise<T[]>;
    protected abstract createImpl(data: Partial<T>): Promise<T>;
    protected abstract updateImpl(id: string, data: Partial<T>): Promise<T>;
    protected abstract deleteImpl(id: string): Promise<void>;
}
//# sourceMappingURL=base.repository.enhanced.example.d.ts.map