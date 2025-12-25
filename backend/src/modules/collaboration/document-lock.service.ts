/**
 * Document Lock Service
 * Pessimistic locking for concurrent editing prevention
 * Following Single Responsibility Principle (SRP)
 */

import { EventBus } from '../../core/events/event-bus';
import { createModuleLogger } from '../../core/logger';
import { ICollaborationRepository } from './collaboration.repository';
import { CollaborationEvents, ILockEventPayload } from './collaboration.events';
import { LockableDocumentType } from '../../db/schema';

const logger = createModuleLogger('DocumentLockService');

// ==================== INTERFACES ====================

export interface IDocumentLockService {
    // Lock operations
    acquireLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string,
        metadata?: ILockMetadata
    ): Promise<ILockResult>;

    releaseLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string
    ): Promise<boolean>;

    forceReleaseLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;

    // Lock status
    getLockStatus(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string
    ): Promise<ILockStatus | null>;

    isLocked(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;

    canEdit(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;

    // Heartbeat
    refreshLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string
    ): Promise<boolean>;

    // Cleanup
    cleanupExpiredLocks(): Promise<number>;

    // User locks
    getUserLocks(tenantId: string, userId: string): Promise<ILockStatus[]>;
    releaseAllUserLocks(tenantId: string, userId: string): Promise<number>;
}

export interface ILockMetadata {
    readonly clientId?: string;
    readonly browserInfo?: string;
    readonly reason?: string;
    readonly [key: string]: unknown;
}

export interface ILockResult {
    readonly success: boolean;
    readonly lock?: ILockStatus;
    readonly error?: {
        readonly code: 'ALREADY_LOCKED' | 'LOCK_FAILED';
        readonly message: string;
        readonly lockedBy?: IUserInfo;
        readonly expiresAt?: string;
    };
}

export interface ILockStatus {
    readonly documentType: LockableDocumentType;
    readonly documentId: string;
    readonly lockedBy: IUserInfo;
    readonly lockedAt: Date;
    readonly expiresAt: Date;
    readonly isExpired: boolean;
}

export interface IUserInfo {
    readonly userId: string;
    readonly email?: string;
    readonly firstName?: string;
    readonly lastName?: string;
}

// ==================== SERVICE ====================

export class DocumentLockService implements IDocumentLockService {
    private readonly eventBus: EventBus;
    private readonly lockDurationMs = 5 * 60 * 1000; // 5 minutes default
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(private readonly repository: ICollaborationRepository) {
        this.eventBus = EventBus.getInstance();
        this.startCleanupJob();
    }

    // ==================== LOCK OPERATIONS ====================

    async acquireLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string,
        metadata?: ILockMetadata
    ): Promise<ILockResult> {
        try {
            // Check for existing lock
            const existingLock = await this.repository.findLock(tenantId, documentType, documentId);

            if (existingLock) {
                const now = new Date();

                // Check if lock is expired
                if (existingLock.expiresAt < now) {
                    // Delete expired lock
                    await this.repository.deleteLock(existingLock.id);
                } else if (existingLock.lockedById === userId) {
                    // Same user already has lock, refresh it
                    await this.repository.updateLockHeartbeat(existingLock.id);
                    return {
                        success: true,
                        lock: this.toLockStatus(existingLock)
                    };
                } else {
                    // Lock held by another user
                    const lockedByUser = existingLock as unknown as {
                        lockedBy?: { email?: string; firstName?: string; lastName?: string };
                    };
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
        } catch (error) {
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

    async releaseLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string
    ): Promise<boolean> {
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
        } catch (error) {
            logger.error('Failed to release lock', { error, documentType, documentId, userId });
            return false;
        }
    }

    async forceReleaseLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean> {
        try {
            const released = await this.repository.deleteLockByDocument(tenantId, documentType, documentId);

            if (released) {
                await this.broadcastLockReleased(tenantId, documentType, documentId);
                logger.info('Lock force released', { documentType, documentId });
            }

            return released;
        } catch (error) {
            logger.error('Failed to force release lock', { error, documentType, documentId });
            return false;
        }
    }

    // ==================== LOCK STATUS ====================

    async getLockStatus(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string
    ): Promise<ILockStatus | null> {
        const lock = await this.repository.findLock(tenantId, documentType, documentId);
        if (!lock) return null;
        return this.toLockStatus(lock);
    }

    async isLocked(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean> {
        const lock = await this.repository.findLock(tenantId, documentType, documentId);
        if (!lock) return false;
        return lock.expiresAt > new Date();
    }

    async canEdit(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string
    ): Promise<boolean> {
        const lock = await this.repository.findLock(tenantId, documentType, documentId);

        if (!lock) return true; // No lock, anyone can edit
        if (lock.expiresAt < new Date()) return true; // Lock expired
        return lock.lockedById === userId; // User owns the lock
    }

    // ==================== HEARTBEAT ====================

    async refreshLock(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string
    ): Promise<boolean> {
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
        } catch (error) {
            logger.error('Failed to refresh lock', { error, documentType, documentId, userId });
            return false;
        }
    }

    // ==================== CLEANUP ====================

    async cleanupExpiredLocks(): Promise<number> {
        try {
            const count = await this.repository.deleteExpiredLocks();
            if (count > 0) {
                logger.info('Expired locks cleaned', { count });
            }
            return count;
        } catch (error) {
            logger.error('Failed to cleanup expired locks', { error });
            return 0;
        }
    }

    // ==================== USER LOCKS ====================

    async getUserLocks(tenantId: string, userId: string): Promise<ILockStatus[]> {
        const locks = await this.repository.getUserLocks(tenantId, userId);
        return locks.map((lock) => this.toLockStatus(lock));
    }

    async releaseAllUserLocks(tenantId: string, userId: string): Promise<number> {
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

    private toLockStatus(lock: {
        documentType: LockableDocumentType;
        documentId: string;
        lockedById: string;
        lockedAt: Date;
        expiresAt: Date;
    }): ILockStatus {
        const now = new Date();
        const lockWithUser = lock as typeof lock & {
            lockedBy?: { email?: string; firstName?: string; lastName?: string };
        };

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

    private async broadcastLockAcquired(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string,
        userId: string,
        expiresAt: Date
    ): Promise<void> {
        const payload: ILockEventPayload = {
            tenantId,
            documentType,
            documentId,
            lockedBy: { userId, email: '', firstName: '', lastName: '' },
            lockedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        await this.eventBus.publish({
            eventId: `lock_${Date.now()}`,
            eventType: CollaborationEvents.LOCK_ACQUIRED,
            timestamp: new Date(),
            aggregateType: 'DocumentLock',
            aggregateId: `${documentType}:${documentId}`,
            payload: payload as unknown as Record<string, unknown>
        });
    }

    private async broadcastLockReleased(
        tenantId: string,
        documentType: LockableDocumentType,
        documentId: string
    ): Promise<void> {
        const payload: ILockEventPayload = {
            tenantId,
            documentType,
            documentId
        };

        await this.eventBus.publish({
            eventId: `unlock_${Date.now()}`,
            eventType: CollaborationEvents.LOCK_RELEASED,
            timestamp: new Date(),
            aggregateType: 'DocumentLock',
            aggregateId: `${documentType}:${documentId}`,
            payload: payload as unknown as Record<string, unknown>
        });
    }

    private startCleanupJob(): void {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks().catch((error) => {
                logger.error('Lock cleanup failed', { error });
            });
        }, 60 * 1000);
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
