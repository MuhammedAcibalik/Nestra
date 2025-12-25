/**
 * Presence Service
 * Tracks online users and their current activities
 * Following Single Responsibility Principle (SRP)
 */
import { IDocumentViewer } from './collaboration.events';
export interface IPresenceService {
    setOnline(userId: string, tenantId: string, metadata: IUserMetadata): Promise<void>;
    setAway(userId: string): Promise<void>;
    setOffline(userId: string): Promise<void>;
    updateActivity(userId: string): Promise<void>;
    getOnlineUsers(tenantId: string): Promise<IOnlineUser[]>;
    isUserOnline(userId: string): Promise<boolean>;
    getUserPresence(userId: string): Promise<IOnlineUser | null>;
    joinDocument(userId: string, documentType: string, documentId: string): Promise<void>;
    leaveDocument(userId: string, documentType: string, documentId: string): Promise<void>;
    getDocumentViewers(tenantId: string, documentType: string, documentId: string): Promise<IDocumentViewer[]>;
    cleanupInactiveUsers(inactiveThresholdMs?: number): Promise<number>;
}
export interface IUserMetadata {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
}
export interface IOnlineUser {
    readonly userId: string;
    readonly tenantId: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly status: 'online' | 'away' | 'offline';
    readonly lastActivity: Date;
    readonly currentDocument?: {
        readonly type: string;
        readonly id: string;
    };
}
export declare class PresenceService implements IPresenceService {
    private readonly eventBus;
    private readonly onlineUsers;
    private readonly documentViewers;
    private cleanupInterval;
    constructor();
    setOnline(userId: string, tenantId: string, metadata: IUserMetadata): Promise<void>;
    setAway(userId: string): Promise<void>;
    setOffline(userId: string): Promise<void>;
    updateActivity(userId: string): Promise<void>;
    getOnlineUsers(tenantId: string): Promise<IOnlineUser[]>;
    isUserOnline(userId: string): Promise<boolean>;
    getUserPresence(userId: string): Promise<IOnlineUser | null>;
    joinDocument(userId: string, documentType: string, documentId: string): Promise<void>;
    leaveDocument(userId: string, documentType: string, documentId: string): Promise<void>;
    getDocumentViewers(tenantId: string, documentType: string, documentId: string): Promise<IDocumentViewer[]>;
    cleanupInactiveUsers(inactiveThresholdMs?: number): Promise<number>;
    private getDocumentKey;
    private broadcastPresence;
    private broadcastDocumentViewers;
    private startCleanupJob;
    destroy(): void;
}
//# sourceMappingURL=presence.service.d.ts.map