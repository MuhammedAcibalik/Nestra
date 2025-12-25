/**
 * Document Lock Service
 * Pessimistic locking for concurrent editing prevention
 * Following Single Responsibility Principle (SRP)
 */
import { ICollaborationRepository } from './collaboration.repository';
import { LockableDocumentType } from '../../db/schema';
export interface IDocumentLockService {
    acquireLock(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string, metadata?: ILockMetadata): Promise<ILockResult>;
    releaseLock(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;
    forceReleaseLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    getLockStatus(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<ILockStatus | null>;
    isLocked(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    canEdit(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;
    refreshLock(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;
    cleanupExpiredLocks(): Promise<number>;
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
export declare class DocumentLockService implements IDocumentLockService {
    private readonly repository;
    private readonly eventBus;
    private readonly lockDurationMs;
    private cleanupInterval;
    constructor(repository: ICollaborationRepository);
    acquireLock(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string, metadata?: ILockMetadata): Promise<ILockResult>;
    releaseLock(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;
    forceReleaseLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    getLockStatus(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<ILockStatus | null>;
    isLocked(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    canEdit(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;
    refreshLock(tenantId: string, documentType: LockableDocumentType, documentId: string, userId: string): Promise<boolean>;
    cleanupExpiredLocks(): Promise<number>;
    getUserLocks(tenantId: string, userId: string): Promise<ILockStatus[]>;
    releaseAllUserLocks(tenantId: string, userId: string): Promise<number>;
    private toLockStatus;
    private broadcastLockAcquired;
    private broadcastLockReleased;
    private startCleanupJob;
    destroy(): void;
}
//# sourceMappingURL=document-lock.service.d.ts.map