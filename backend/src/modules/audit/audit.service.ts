/**
 * Audit Service
 * Business logic for audit trail with diff calculation
 */

import { Request } from 'express';
import { AuditRepository, IAuditQueryOptions } from './audit.repository';
import { AuditLog, NewAuditLog, AuditAction } from '../../db/schema';
import { createModuleLogger } from '../../core/logger';
import { EventBus } from '../../core/events/event-bus';

const logger = createModuleLogger('AuditService');

// ==================== INTERFACES ====================

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

// ==================== SERVICE ====================

export class AuditService implements IAuditService {
    private readonly eventBus: EventBus;

    constructor(private readonly repository: AuditRepository) {
        this.eventBus = EventBus.getInstance();
    }

    async record(input: IRecordAuditInput): Promise<IAuditDto> {
        // Calculate changed fields for UPDATE actions
        const changedFields =
            input.action === 'UPDATE' && input.previousValue && input.newValue
                ? this.calculateChangedFields(input.previousValue, input.newValue)
                : undefined;

        const auditData: NewAuditLog = {
            tenantId: input.context.tenantId,
            userId: input.context.userId,
            userEmail: input.context.userEmail,
            userRole: input.context.userRole,
            ipAddress: input.context.ipAddress,
            userAgent: input.context.userAgent,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            entityName: input.entityName,
            previousValue: input.previousValue,
            newValue: input.newValue,
            changedFields,
            requestId: input.context.requestId,
            sessionId: input.context.sessionId,
            module: input.module,
            metadata: input.metadata
        };

        const result = await this.repository.create(auditData);

        // Emit event for real-time dashboard
        await this.eventBus.publish({
            eventId: `audit_${result.id}`,
            eventType: 'audit.recorded',
            timestamp: new Date(),
            aggregateType: 'AuditLog',
            aggregateId: result.id,
            payload: {
                tenantId: result.tenantId,
                action: result.action,
                entityType: result.entityType,
                entityId: result.entityId,
                userId: result.userId
            }
        });

        logger.debug('Audit recorded', {
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId
        });

        return this.toDto(result);
    }

    async getAuditLogs(options: IAuditQueryOptions): Promise<IAuditDto[]> {
        const logs = await this.repository.findMany(options);
        return logs.map((log) => this.toDto(log));
    }

    async getEntityHistory(tenantId: string, entityType: string, entityId: string, limit = 20): Promise<IAuditDto[]> {
        const logs = await this.repository.getEntityHistory(tenantId, entityType, entityId, limit);
        return logs.map((log) => this.toDto(log));
    }

    extractContext(req: Request): IAuditContext | null {
        const user = (req as Request & { user?: { id: string; email?: string; role?: string; tenantId?: string } })
            .user;

        if (!user?.id || !user?.tenantId) {
            return null;
        }

        return {
            tenantId: user.tenantId,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestId: req.requestId
        };
    }

    // ==================== HELPERS ====================

    private calculateChangedFields(prev: Record<string, unknown>, next: Record<string, unknown>): string[] {
        const changedFields: string[] = [];
        const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

        for (const key of allKeys) {
            // Skip internal fields
            if (['updatedAt', 'createdAt', 'id'].includes(key)) continue;

            const prevValue = JSON.stringify(prev[key]);
            const nextValue = JSON.stringify(next[key]);

            if (prevValue !== nextValue) {
                changedFields.push(key);
            }
        }

        return changedFields;
    }

    private toDto(log: AuditLog): IAuditDto {
        const userInfo = log as AuditLog & { user?: { firstName?: string; lastName?: string } };

        return {
            id: log.id,
            tenantId: log.tenantId,
            userId: log.userId,
            userName: userInfo.user
                ? `${userInfo.user.firstName ?? ''} ${userInfo.user.lastName ?? ''}`.trim()
                : undefined,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            entityName: log.entityName ?? undefined,
            changedFields: log.changedFields ?? undefined,
            previousValue: log.previousValue as Record<string, unknown> | undefined,
            newValue: log.newValue as Record<string, unknown> | undefined,
            createdAt: log.createdAt
        };
    }
}

// ==================== AUDIT HELPER ====================

/**
 * Global audit service instance for use in decorators
 */
let auditServiceInstance: AuditService | null = null;

export function setAuditService(service: AuditService): void {
    auditServiceInstance = service;
}

export function getAuditService(): AuditService | null {
    return auditServiceInstance;
}

/**
 * Quick audit record function for manual usage
 */
export async function recordAudit(input: IRecordAuditInput): Promise<void> {
    const service = getAuditService();
    if (service) {
        await service.record(input);
    } else {
        logger.warn('Audit service not initialized, log not recorded');
    }
}
