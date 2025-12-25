/**
 * Collaboration Repository
 * Data access for collaboration features
 * Following Repository Pattern with Drizzle ORM
 */

import { eq, and, lt, desc } from 'drizzle-orm';
import { Database } from '../../db';
import {
    documentLocks,
    activities,
    activityReadStatus,
    DocumentLock,
    NewDocumentLock,
    Activity,
    NewActivity,
    LockableDocumentType
} from '../../db/schema';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('CollaborationRepository');

// ==================== INTERFACES ====================

export interface ICollaborationRepository {
    // Document Locks
    findLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<DocumentLock | null>;
    createLock(data: NewDocumentLock): Promise<DocumentLock>;
    updateLockHeartbeat(lockId: string): Promise<boolean>;
    deleteLock(lockId: string): Promise<boolean>;
    deleteLockByDocument(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    deleteExpiredLocks(): Promise<number>;
    getUserLocks(tenantId: string, userId: string): Promise<DocumentLock[]>;

    // Activities
    createActivity(data: NewActivity): Promise<Activity>;
    getActivities(tenantId: string, options: IActivityQueryOptions): Promise<Activity[]>;
    markAsRead(activityId: string, userId: string): Promise<void>;
    markAllAsRead(tenantId: string, userId: string): Promise<void>;
    getUnreadCount(tenantId: string, userId: string): Promise<number>;
    getActivityById(activityId: string): Promise<Activity | null>;
}

export interface IActivityQueryOptions {
    readonly limit?: number;
    readonly offset?: number;
    readonly activityTypes?: string[];
    readonly targetType?: string;
    readonly targetId?: string;
    readonly userId?: string;  // Filter by mentioned user
}

// ==================== REPOSITORY ====================

export class CollaborationRepository implements ICollaborationRepository {
    constructor(private readonly db: Database) { }

    // ==================== DOCUMENT LOCKS ====================

    async findLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string
    ): Promise<DocumentLock | null> {
        const result = await this.db.query.documentLocks.findFirst({
            where: and(
                eq(documentLocks.tenantId, tenantId),
                eq(documentLocks.documentType, documentType),
                eq(documentLocks.documentId, documentId)
            ),
            with: {
                lockedBy: true
            }
        });
        return result ?? null;
    }

    async createLock(data: NewDocumentLock): Promise<DocumentLock> {
        const [result] = await this.db
            .insert(documentLocks)
            .values(data)
            .returning();

        logger.info('Lock created', {
            documentType: result.documentType,
            documentId: result.documentId,
            lockedBy: result.lockedById
        });

        return result;
    }

    async updateLockHeartbeat(lockId: string): Promise<boolean> {
        const now = new Date();
        const newExpiry = new Date(now.getTime() + 5 * 60 * 1000);  // 5 minutes from now

        const result = await this.db
            .update(documentLocks)
            .set({
                lastHeartbeat: now,
                expiresAt: newExpiry
            })
            .where(eq(documentLocks.id, lockId))
            .returning({ id: documentLocks.id });

        return result.length > 0;
    }

    async deleteLock(lockId: string): Promise<boolean> {
        const result = await this.db
            .delete(documentLocks)
            .where(eq(documentLocks.id, lockId))
            .returning({ id: documentLocks.id });

        if (result.length > 0) {
            logger.info('Lock deleted', { lockId });
            return true;
        }
        return false;
    }

    async deleteLockByDocument(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string
    ): Promise<boolean> {
        const result = await this.db
            .delete(documentLocks)
            .where(
                and(
                    eq(documentLocks.tenantId, tenantId),
                    eq(documentLocks.documentType, documentType),
                    eq(documentLocks.documentId, documentId)
                )
            )
            .returning({ id: documentLocks.id });

        if (result.length > 0) {
            logger.info('Lock deleted by document', { documentType, documentId });
            return true;
        }
        return false;
    }

    async deleteExpiredLocks(): Promise<number> {
        const now = new Date();
        const result = await this.db
            .delete(documentLocks)
            .where(lt(documentLocks.expiresAt, now))
            .returning({ id: documentLocks.id });

        if (result.length > 0) {
            logger.info('Expired locks cleaned', { count: result.length });
        }
        return result.length;
    }

    async getUserLocks(tenantId: string, userId: string): Promise<DocumentLock[]> {
        return this.db.query.documentLocks.findMany({
            where: and(
                eq(documentLocks.tenantId, tenantId),
                eq(documentLocks.lockedById, userId)
            )
        });
    }

    // ==================== ACTIVITIES ====================

    async createActivity(data: NewActivity): Promise<Activity> {
        const [result] = await this.db
            .insert(activities)
            .values(data)
            .returning();

        logger.debug('Activity created', {
            id: result.id,
            type: result.activityType
        });

        return result;
    }

    async getActivities(tenantId: string, options: IActivityQueryOptions = {}): Promise<Activity[]> {
        const { limit = 50, offset = 0, targetType, targetId } = options;

        const conditions = [eq(activities.tenantId, tenantId)];

        if (targetType) {
            conditions.push(eq(activities.targetType, targetType));
        }
        if (targetId) {
            conditions.push(eq(activities.targetId, targetId));
        }

        return this.db.query.activities.findMany({
            where: and(...conditions),
            orderBy: desc(activities.createdAt),
            limit,
            offset,
            with: {
                actor: true
            }
        });
    }

    async markAsRead(activityId: string, userId: string): Promise<void> {
        await this.db
            .insert(activityReadStatus)
            .values({
                activityId,
                userId
            })
            .onConflictDoNothing();
    }

    async markAllAsRead(tenantId: string, userId: string): Promise<void> {
        // Get all unread activities for this tenant
        const unreadActivities = await this.db
            .select({ id: activities.id })
            .from(activities)
            .leftJoin(
                activityReadStatus,
                and(
                    eq(activityReadStatus.activityId, activities.id),
                    eq(activityReadStatus.userId, userId)
                )
            )
            .where(
                and(
                    eq(activities.tenantId, tenantId),
                    eq(activityReadStatus.activityId, null as unknown as string)  // NULL = not read
                )
            );

        // Mark all as read
        if (unreadActivities.length > 0) {
            const values = unreadActivities.map(a => ({
                activityId: a.id,
                userId
            }));

            await this.db
                .insert(activityReadStatus)
                .values(values)
                .onConflictDoNothing();
        }
    }

    async getUnreadCount(tenantId: string, userId: string): Promise<number> {
        const result = await this.db
            .select({ id: activities.id })
            .from(activities)
            .leftJoin(
                activityReadStatus,
                and(
                    eq(activityReadStatus.activityId, activities.id),
                    eq(activityReadStatus.userId, userId)
                )
            )
            .where(
                and(
                    eq(activities.tenantId, tenantId),
                    eq(activityReadStatus.activityId, null as unknown as string)
                )
            );

        return result.length;
    }

    async getActivityById(activityId: string): Promise<Activity | null> {
        const result = await this.db.query.activities.findFirst({
            where: eq(activities.id, activityId),
            with: {
                actor: true
            }
        });
        return result ?? null;
    }
}
