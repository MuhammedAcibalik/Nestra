"use strict";
/**
 * Collaboration Repository
 * Data access for collaboration features
 * Following Repository Pattern with Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../db/schema");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('CollaborationRepository');
// ==================== REPOSITORY ====================
class CollaborationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    // ==================== DOCUMENT LOCKS ====================
    async findLock(tenantId, documentType, documentId) {
        const result = await this.db.query.documentLocks.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.documentLocks.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.documentLocks.documentType, documentType), (0, drizzle_orm_1.eq)(schema_1.documentLocks.documentId, documentId)),
            with: {
                lockedBy: true
            }
        });
        return result ?? null;
    }
    async createLock(data) {
        const [result] = await this.db.insert(schema_1.documentLocks).values(data).returning();
        logger.info('Lock created', {
            documentType: result.documentType,
            documentId: result.documentId,
            lockedBy: result.lockedById
        });
        return result;
    }
    async updateLockHeartbeat(lockId) {
        const now = new Date();
        const newExpiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        const result = await this.db
            .update(schema_1.documentLocks)
            .set({
            lastHeartbeat: now,
            expiresAt: newExpiry
        })
            .where((0, drizzle_orm_1.eq)(schema_1.documentLocks.id, lockId))
            .returning({ id: schema_1.documentLocks.id });
        return result.length > 0;
    }
    async deleteLock(lockId) {
        const result = await this.db
            .delete(schema_1.documentLocks)
            .where((0, drizzle_orm_1.eq)(schema_1.documentLocks.id, lockId))
            .returning({ id: schema_1.documentLocks.id });
        if (result.length > 0) {
            logger.info('Lock deleted', { lockId });
            return true;
        }
        return false;
    }
    async deleteLockByDocument(tenantId, documentType, documentId) {
        const result = await this.db
            .delete(schema_1.documentLocks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.documentLocks.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.documentLocks.documentType, documentType), (0, drizzle_orm_1.eq)(schema_1.documentLocks.documentId, documentId)))
            .returning({ id: schema_1.documentLocks.id });
        if (result.length > 0) {
            logger.info('Lock deleted by document', { documentType, documentId });
            return true;
        }
        return false;
    }
    async deleteExpiredLocks() {
        const now = new Date();
        const result = await this.db
            .delete(schema_1.documentLocks)
            .where((0, drizzle_orm_1.lt)(schema_1.documentLocks.expiresAt, now))
            .returning({ id: schema_1.documentLocks.id });
        if (result.length > 0) {
            logger.info('Expired locks cleaned', { count: result.length });
        }
        return result.length;
    }
    async getUserLocks(tenantId, userId) {
        return this.db.query.documentLocks.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.documentLocks.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.documentLocks.lockedById, userId))
        });
    }
    // ==================== ACTIVITIES ====================
    async createActivity(data) {
        const [result] = await this.db.insert(schema_1.activities).values(data).returning();
        logger.debug('Activity created', {
            id: result.id,
            type: result.activityType
        });
        return result;
    }
    async getActivities(tenantId, options = {}) {
        const { limit = 50, offset = 0, targetType, targetId } = options;
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.activities.tenantId, tenantId)];
        if (targetType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.activities.targetType, targetType));
        }
        if (targetId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.activities.targetId, targetId));
        }
        return this.db.query.activities.findMany({
            where: (0, drizzle_orm_1.and)(...conditions),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.activities.createdAt),
            limit,
            offset,
            with: {
                actor: true
            }
        });
    }
    async markAsRead(activityId, userId) {
        await this.db
            .insert(schema_1.activityReadStatus)
            .values({
            activityId,
            userId
        })
            .onConflictDoNothing();
    }
    async markAllAsRead(tenantId, userId) {
        // Get all unread activities for this tenant
        const unreadActivities = await this.db
            .select({ id: schema_1.activities.id })
            .from(schema_1.activities)
            .leftJoin(schema_1.activityReadStatus, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.activityReadStatus.activityId, schema_1.activities.id), (0, drizzle_orm_1.eq)(schema_1.activityReadStatus.userId, userId)))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.activities.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.activityReadStatus.activityId, null) // NULL = not read
        ));
        // Mark all as read
        if (unreadActivities.length > 0) {
            const values = unreadActivities.map((a) => ({
                activityId: a.id,
                userId
            }));
            await this.db.insert(schema_1.activityReadStatus).values(values).onConflictDoNothing();
        }
    }
    async getUnreadCount(tenantId, userId) {
        const result = await this.db
            .select({ id: schema_1.activities.id })
            .from(schema_1.activities)
            .leftJoin(schema_1.activityReadStatus, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.activityReadStatus.activityId, schema_1.activities.id), (0, drizzle_orm_1.eq)(schema_1.activityReadStatus.userId, userId)))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.activities.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.activityReadStatus.activityId, null)));
        return result.length;
    }
    async getActivityById(activityId) {
        const result = await this.db.query.activities.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.activities.id, activityId),
            with: {
                actor: true
            }
        });
        return result ?? null;
    }
}
exports.CollaborationRepository = CollaborationRepository;
//# sourceMappingURL=collaboration.repository.js.map