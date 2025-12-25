/**
 * Audit Repository
 * Database operations for audit logs
 */

import { Database } from '../../db';
import { auditLogs, AuditLog, NewAuditLog } from '../../db/schema';
import { eq, desc, and, between, SQL } from 'drizzle-orm';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('AuditRepository');

// ==================== INTERFACES ====================

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

// ==================== REPOSITORY ====================

export class AuditRepository implements IAuditRepository {
    constructor(private readonly db: Database) {}

    async create(data: NewAuditLog): Promise<AuditLog> {
        try {
            const [result] = await this.db.insert(auditLogs).values(data).returning();
            return result;
        } catch (error) {
            logger.error('Failed to create audit log', { error, entityType: data.entityType });
            throw error;
        }
    }

    async findById(id: string): Promise<AuditLog | null> {
        const result = await this.db.query.auditLogs.findFirst({
            where: eq(auditLogs.id, id),
            with: {
                user: true
            }
        });
        return result ?? null;
    }

    async findMany(options: IAuditQueryOptions): Promise<AuditLog[]> {
        const conditions: SQL[] = [eq(auditLogs.tenantId, options.tenantId)];

        if (options.entityType) {
            conditions.push(eq(auditLogs.entityType, options.entityType));
        }
        if (options.entityId) {
            conditions.push(eq(auditLogs.entityId, options.entityId));
        }
        if (options.userId) {
            conditions.push(eq(auditLogs.userId, options.userId));
        }
        if (options.action) {
            conditions.push(eq(auditLogs.action, options.action));
        }
        if (options.module) {
            conditions.push(eq(auditLogs.module, options.module));
        }
        if (options.startDate && options.endDate) {
            conditions.push(between(auditLogs.createdAt, options.startDate, options.endDate));
        }

        return this.db.query.auditLogs.findMany({
            where: and(...conditions),
            with: {
                user: true
            },
            orderBy: [desc(auditLogs.createdAt)],
            limit: options.limit ?? 50,
            offset: options.offset ?? 0
        });
    }

    async countByEntity(tenantId: string, entityType: string, entityId: string): Promise<number> {
        const result = await this.db
            .select()
            .from(auditLogs)
            .where(
                and(
                    eq(auditLogs.tenantId, tenantId),
                    eq(auditLogs.entityType, entityType),
                    eq(auditLogs.entityId, entityId)
                )
            );
        return result.length;
    }

    async getEntityHistory(tenantId: string, entityType: string, entityId: string, limit = 20): Promise<AuditLog[]> {
        return this.db.query.auditLogs.findMany({
            where: and(
                eq(auditLogs.tenantId, tenantId),
                eq(auditLogs.entityType, entityType),
                eq(auditLogs.entityId, entityId)
            ),
            with: {
                user: true
            },
            orderBy: [desc(auditLogs.createdAt)],
            limit
        });
    }

    async deleteOlderThan(tenantId: string, days: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await this.db
            .delete(auditLogs)
            .where(and(eq(auditLogs.tenantId, tenantId), between(auditLogs.createdAt, new Date(0), cutoffDate)))
            .returning();

        logger.info('Deleted old audit logs', { tenantId, days, count: result.length });
        return result.length;
    }
}
