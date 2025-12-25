/**
 * Audit Service
 * Business logic for audit trail with diff calculation
 */
import { Request } from 'express';
import { AuditRepository, IAuditQueryOptions } from './audit.repository';
import { AuditAction } from '../../db/schema';
export interface IAuditContext {
    tenantId: string;
    userId: string;
    userEmail?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
}
export interface IRecordAuditInput {
    context: IAuditContext;
    action: AuditAction;
    entityType: string;
    entityId: string;
    entityName?: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    module?: string;
    metadata?: Record<string, unknown>;
}
export interface IAuditDto {
    id: string;
    tenantId: string;
    userId: string;
    userName?: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    changedFields?: string[];
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    createdAt: Date;
}
export interface IAuditService {
    record(input: IRecordAuditInput): Promise<IAuditDto>;
    getAuditLogs(options: IAuditQueryOptions): Promise<IAuditDto[]>;
    getEntityHistory(tenantId: string, entityType: string, entityId: string, limit?: number): Promise<IAuditDto[]>;
    extractContext(req: Request): IAuditContext | null;
}
export declare class AuditService implements IAuditService {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: AuditRepository);
    record(input: IRecordAuditInput): Promise<IAuditDto>;
    getAuditLogs(options: IAuditQueryOptions): Promise<IAuditDto[]>;
    getEntityHistory(tenantId: string, entityType: string, entityId: string, limit?: number): Promise<IAuditDto[]>;
    extractContext(req: Request): IAuditContext | null;
    private calculateChangedFields;
    private toDto;
}
export declare function setAuditService(service: AuditService): void;
export declare function getAuditService(): AuditService | null;
/**
 * Quick audit record function for manual usage
 */
export declare function recordAudit(input: IRecordAuditInput): Promise<void>;
//# sourceMappingURL=audit.service.d.ts.map