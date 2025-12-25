"use strict";
/**
 * Document Lock Service
 * Pessimistic locking for concurrent editing prevention
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentLockService = void 0;
const event_bus_1 = require("../../core/events/event-bus");
const logger_1 = require("../../core/logger");
const collaboration_events_1 = require("./collaboration.events");
const logger = (0, logger_1.createModuleLogger)('DocumentLockService');
// ==================== SERVICE ====================
class DocumentLockService {
    repository;
    eventBus;
    lockDurationMs = 5 * 60 * 1000; // 5 minutes default
    cleanupInterval = null;
    constructor(repository) {
        this.repository = repository;
        this.eventBus = event_bus_1.EventBus.getInstance();
        this.startCleanupJob();
    }
    // ==================== LOCK OPERATIONS ====================
    async acquireLock(tenantId, documentType, documentId, userId, metadata) {
        try {
            // Check for existing lock
            const existingLock = await this.repository.findLock(tenantId, documentType, documentId);
            if (existingLock) {
                const now = new Date();
                // Check if lock is expired
                if (existingLock.expiresAt < now) {
                    // Delete expired lock
                    await this.repository.deleteLock(existingLock.id);
                }
                else if (existingLock.lockedById === userId) {
                    // Same user already has lock, refresh it
                    await this.repository.updateLockHeartbeat(existingLock.id);
                    return {
                        success: true,
                        lock: this.toLockStatus(existingLock)
                    };
                }
                else {
                    // Lock held by another user
                    const lockedByUser = existingLock;
                    return {
                        success: false,
                        error: {
                            code: 'ALREADY_LOCKED',
                            message: 'Document is locked by another user',
                            lockedBy: {
                                userId: existingLock.lockedById,
                                email: lockedByUser.lockedBy?.email,
                                firstName: lockedByUser.lockedBy?.firstName,
                                lastName: lockedByUser.lockedBy?.lastName
                            },
                            expiresAt: existingLock.expiresAt.toISOString()
                        }
                    };
                }
            }
            // Create new lock
            const expiresAt = new Date(Date.now() + this.lockDurationMs);
            const lock = await this.repository.createLock({
                tenantId,
                documentType,
                documentId,
                lockedById: userId,
                expiresAt,
                metadata
            });
            // Broadcast lock event
            await this.broadcastLockAcquired(tenantId, documentType, documentId, userId, expiresAt);
            logger.info('Lock acquired', { documentType, documentId, userId });
            return {
                success: true,
                lock: {
                    documentType,
                    documentId,
                    lockedBy: { userId },
                    lockedAt: lock.lockedAt,
                    expiresAt: lock.expiresAt,
                    isExpired: false
                }
            };
        }
        catch (error) {
            logger.error('Failed to acquire lock', { error, documentType, documentId, userId });
            return {
                success: false,
                error: {
                    code: 'LOCK_FAILED',
                    message: 'Failed to acquire lock'
                }
            };
        }
    }
    async releaseLock(tenantId, documentType, documentId, userId) {
        try {
            const lock = await this.repository.findLock(tenantId, documentType, documentId);
            if (!lock) {
                return true; // No lock to release
            }
            if (lock.lockedById !== userId) {
                logger.warn('User tried to release lock held by another user', {
                    documentType,
                    documentId,
                    userId,
                    lockOwner: lock.lockedById
                });
                return false;
            }
            await this.repository.deleteLock(lock.id);
            await this.broadcastLockReleased(tenantId, documentType, documentId);
            logger.info('Lock released', { documentType, documentId, userId });
            return true;
        }
        catch (error) {
            logger.error('Failed to release lock', { error, documentType, documentId, userId });
            return false;
        }
    }
    async forceReleaseLock(tenantId, documentType, documentId) {
        try {
            const released = await this.repository.deleteLockByDocument(tenantId, documentType, documentId);
            if (released) {
                await this.broadcastLockReleased(tenantId, documentType, documentId);
                logger.info('Lock force released', { documentType, documentId });
            }
            return released;
        }
        catch (error) {
            logger.error('Failed to force release lock', { error, documentType, documentId });
            return false;
        }
    }
    // ==================== LOCK STATUS ====================
    async getLockStatus(tenantId, documentType, documentId) {
        const lock = await this.repository.findLock(tenantId, documentType, documentId);
        if (!lock)
            return null;
        return this.toLockStatus(lock);
    }
    async isLocked(tenantId, documentType, documentId) {
        const lock = await this.repository.findLock(tenantId, documentType, documentId);
        if (!lock)
            return false;
        return lock.expiresAt > new Date();
    }
    async canEdit(tenantId, documentType, documentId, userId) {
        const lock = await this.repository.findLock(tenantId, documentType, documentId);
        if (!lock)
            return true; // No lock, anyone can edit
        if (lock.expiresAt < new Date())
            return true; // Lock expired
        return lock.lockedById === userId; // User owns the lock
    }
    // ==================== HEARTBEAT ====================
    async refreshLock(tenantId, documentType, documentId, userId) {
        try {
            const lock = await this.repository.findLock(tenantId, documentType, documentId);
            if (!lock?.lockedById || lock.lockedById !== userId) {
                return false;
            }
            const success = await this.repository.updateLockHeartbeat(lock.id);
            if (success) {
                logger.debug('Lock refreshed', { documentType, documentId, userId });
            }
            return success;
        }
        catch (error) {
            logger.error('Failed to refresh lock', { error, documentType, documentId, userId });
            return false;
        }
    }
    // ==================== CLEANUP ====================
    async cleanupExpiredLocks() {
        try {
            const count = await this.repository.deleteExpiredLocks();
            if (count > 0) {
                logger.info('Expired locks cleaned', { count });
            }
            return count;
        }
        catch (error) {
            logger.error('Failed to cleanup expired locks', { error });
            return 0;
        }
    }
    // ==================== USER LOCKS ====================
    async getUserLocks(tenantId, userId) {
        const locks = await this.repository.getUserLocks(tenantId, userId);
        return locks.map(lock => this.toLockStatus(lock));
    }
    async releaseAllUserLocks(tenantId, userId) {
        const locks = await this.repository.getUserLocks(tenantId, userId);
        let released = 0;
        for (const lock of locks) {
            const success = await this.repository.deleteLock(lock.id);
            if (success) {
                released++;
                await this.broadcastLockReleased(tenantId, lock.documentType, lock.documentId);
            }
        }
        if (released > 0) {
            logger.info('User locks released', { userId, count: released });
        }
        return released;
    }
    // ==================== HELPERS ====================
    toLockStatus(lock) {
        const now = new Date();
        const lockWithUser = lock;
        return {
            documentType: lock.documentType,
            documentId: lock.documentId,
            lockedBy: {
                userId: lock.lockedById,
                email: lockWithUser.lockedBy?.email,
                firstName: lockWithUser.lockedBy?.firstName,
                lastName: lockWithUser.lockedBy?.lastName
            },
            lockedAt: lock.lockedAt,
            expiresAt: lock.expiresAt,
            isExpired: lock.expiresAt < now
        };
    }
    async broadcastLockAcquired(tenantId, documentType, documentId, userId, expiresAt) {
        const payload = {
            tenantId,
            documentType,
            documentId,
            lockedBy: { userId, email: '', firstName: '', lastName: '' },
            lockedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        await this.eventBus.publish({
            eventId: `lock_${Date.now()}`,
            eventType: collaboration_events_1.CollaborationEvents.LOCK_ACQUIRED,
            timestamp: new Date(),
            aggregateType: 'DocumentLock',
            aggregateId: `${documentType}:${documentId}`,
            payload: payload
        });
    }
    async broadcastLockReleased(tenantId, documentType, documentId) {
        const payload = {
            tenantId,
            documentType,
            documentId
        };
        await this.eventBus.publish({
            eventId: `unlock_${Date.now()}`,
            eventType: collaboration_events_1.CollaborationEvents.LOCK_RELEASED,
            timestamp: new Date(),
            aggregateType: 'DocumentLock',
            aggregateId: `${documentType}:${documentId}`,
            payload: payload
        });
    }
    startCleanupJob() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks().catch(error => {
                logger.error('Lock cleanup failed', { error });
            });
        }, 60 * 1000);
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
exports.DocumentLockService = DocumentLockService;
//# sourceMappingURL=document-lock.service.js.map