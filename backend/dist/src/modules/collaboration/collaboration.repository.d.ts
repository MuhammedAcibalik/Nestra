/**
 * Collaboration Repository
 * Data access for collaboration features
 * Following Repository Pattern with Drizzle ORM
 */
import { Database } from '../../db';
import { DocumentLock, NewDocumentLock, Activity, NewActivity, LockableDocumentType } from '../../db/schema';
export interface ICollaborationRepository {
    findLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<DocumentLock | null>;
    createLock(data: NewDocumentLock): Promise<DocumentLock>;
    updateLockHeartbeat(lockId: string): Promise<boolean>;
    deleteLock(lockId: string): Promise<boolean>;
    deleteLockByDocument(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    deleteExpiredLocks(): Promise<number>;
    getUserLocks(tenantId: string, userId: string): Promise<DocumentLock[]>;
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
    readonly userId?: string;
}
export declare class CollaborationRepository implements ICollaborationRepository {
    private readonly db;
    constructor(db: Database);
    findLock(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<DocumentLock | null>;
    createLock(data: NewDocumentLock): Promise<DocumentLock>;
    updateLockHeartbeat(lockId: string): Promise<boolean>;
    deleteLock(lockId: string): Promise<boolean>;
    deleteLockByDocument(tenantId: string, documentType: LockableDocumentType, documentId: string): Promise<boolean>;
    deleteExpiredLocks(): Promise<number>;
    getUserLocks(tenantId: string, userId: string): Promise<DocumentLock[]>;
    createActivity(data: NewActivity): Promise<Activity>;
    getActivities(tenantId: string, options?: IActivityQueryOptions): Promise<Activity[]>;
    markAsRead(activityId: string, userId: string): Promise<void>;
    markAllAsRead(tenantId: string, userId: string): Promise<void>;
    getUnreadCount(tenantId: string, userId: string): Promise<number>;
    getActivityById(activityId: string): Promise<Activity | null>;
}
//# sourceMappingURL=collaboration.repository.d.ts.map