/**
 * Audit Repository
 * Database operations for audit logs
 */
import { Database } from '../../db';
import { AuditLog, NewAuditLog } from '../../db/schema';
export interface IAuditQueryOptions {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    module?: string;
    limit?: number;
    offset?: number;
}
export interface IAuditRepository {
    create(data: NewAuditLog): Promise<AuditLog>;
    findById(id: string): Promise<AuditLog | null>;
    findMany(options: IAuditQueryOptions): Promise<AuditLog[]>;
    countByEntity(tenantId: string, entityType: string, entityId: string): Promise<number>;
    getEntityHistory(tenantId: string, entityType: string, entityId: string, limit?: number): Promise<AuditLog[]>;
    deleteOlderThan(tenantId: string, days: number): Promise<number>;
}
export declare class AuditRepository implements IAuditRepository {
    private readonly db;
    constructor(db: Database);
    create(data: NewAuditLog): Promise<AuditLog>;
    findById(id: string): Promise<AuditLog | null>;
    findMany(options: IAuditQueryOptions): Promise<AuditLog[]>;
    countByEntity(tenantId: string, entityType: string, entityId: string): Promise<number>;
    getEntityHistory(tenantId: string, entityType: string, entityId: string, limit?: number): Promise<AuditLog[]>;
    deleteOlderThan(tenantId: string, days: number): Promise<number>;
}
//# sourceMappingURL=audit.repository.d.ts.map