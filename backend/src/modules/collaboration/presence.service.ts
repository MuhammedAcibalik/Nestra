/**
 * Presence Service
 * Tracks online users and their current activities
 * Following Single Responsibility Principle (SRP)
 */

import { EventBus } from '../../core/events/event-bus';
import { createModuleLogger } from '../../core/logger';
import { CollaborationEvents, IUserPresencePayload, IDocumentViewersPayload, IDocumentViewer } from './collaboration.events';

const logger = createModuleLogger('PresenceService');

// ==================== INTERFACES ====================

export interface IPresenceService {
    // User presence
    setOnline(userId: string, tenantId: string, metadata: IUserMetadata): Promise<void>;
    setAway(userId: string): Promise<void>;
    setOffline(userId: string): Promise<void>;
    updateActivity(userId: string): Promise<void>;

    // Queries
    getOnlineUsers(tenantId: string): Promise<IOnlineUser[]>;
    isUserOnline(userId: string): Promise<boolean>;
    getUserPresence(userId: string): Promise<IOnlineUser | null>;

    // Document presence
    joinDocument(userId: string, documentType: string, documentId: string): Promise<void>;
    leaveDocument(userId: string, documentType: string, documentId: string): Promise<void>;
    getDocumentViewers(tenantId: string, documentType: string, documentId: string): Promise<IDocumentViewer[]>;

    // Cleanup
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

// ==================== SERVICE ====================

export class PresenceService implements IPresenceService {
    private readonly eventBus: EventBus;

    // In-memory presence store (in production, use Redis)
    private readonly onlineUsers: Map<string, IOnlineUser> = new Map();
    private readonly documentViewers: Map<string, Set<string>> = new Map();  // docKey -> userIds

    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.eventBus = EventBus.getInstance();
        this.startCleanupJob();
    }

    // ==================== USER PRESENCE ====================

    async setOnline(userId: string, tenantId: string, metadata: IUserMetadata): Promise<void> {
        const user: IOnlineUser = {
            userId,
            tenantId,
            email: metadata.email,
            firstName: metadata.firstName,
            lastName: metadata.lastName,
            status: 'online',
            lastActivity: new Date()
        };

        this.onlineUsers.set(userId, user);

        // Broadcast presence update
        await this.broadcastPresence(user, 'online');

        logger.debug('User online', { userId, tenantId });
    }

    async setAway(userId: string): Promise<void> {
        const user = this.onlineUsers.get(userId);
        if (user) {
            const updatedUser: IOnlineUser = {
                ...user,
                status: 'away',
                lastActivity: new Date()
            };
            this.onlineUsers.set(userId, updatedUser);
            await this.broadcastPresence(updatedUser, 'away');
        }
    }

    async setOffline(userId: string): Promise<void> {
        const user = this.onlineUsers.get(userId);
        if (user) {
            // Remove from all documents
            if (user.currentDocument) {
                await this.leaveDocument(userId, user.currentDocument.type, user.currentDocument.id);
            }

            this.onlineUsers.delete(userId);
            await this.broadcastPresence({ ...user, status: 'offline' }, 'offline');

            logger.debug('User offline', { userId });
        }
    }

    async updateActivity(userId: string): Promise<void> {
        const user = this.onlineUsers.get(userId);
        if (user) {
            const updatedUser: IOnlineUser = {
                ...user,
                status: 'online',
                lastActivity: new Date()
            };
            this.onlineUsers.set(userId, updatedUser);
        }
    }

    // ==================== QUERIES ====================

    async getOnlineUsers(tenantId: string): Promise<IOnlineUser[]> {
        const users: IOnlineUser[] = [];
        for (const user of this.onlineUsers.values()) {
            if (user.tenantId === tenantId && user.status !== 'offline') {
                users.push(user);
            }
        }
        return users;
    }

    async isUserOnline(userId: string): Promise<boolean> {
        const user = this.onlineUsers.get(userId);
        return user?.status === 'online';
    }

    async getUserPresence(userId: string): Promise<IOnlineUser | null> {
        return this.onlineUsers.get(userId) ?? null;
    }

    // ==================== DOCUMENT PRESENCE ====================

    async joinDocument(userId: string, documentType: string, documentId: string): Promise<void> {
        const user = this.onlineUsers.get(userId);
        if (!user) return;

        // Leave previous document if any
        if (user.currentDocument) {
            await this.leaveDocument(userId, user.currentDocument.type, user.currentDocument.id);
        }

        // Update user's current document
        const updatedUser: IOnlineUser = {
            ...user,
            currentDocument: { type: documentType, id: documentId },
            lastActivity: new Date()
        };
        this.onlineUsers.set(userId, updatedUser);

        // Add to document viewers
        const docKey = this.getDocumentKey(documentType, documentId);
        const viewers = this.documentViewers.get(docKey) ?? new Set();
        viewers.add(userId);
        this.documentViewers.set(docKey, viewers);

        // Broadcast
        await this.broadcastDocumentViewers(user.tenantId, documentType, documentId);

        logger.debug('User joined document', { userId, documentType, documentId });
    }

    async leaveDocument(userId: string, documentType: string, documentId: string): Promise<void> {
        const user = this.onlineUsers.get(userId);

        // Remove from document viewers
        const docKey = this.getDocumentKey(documentType, documentId);
        const viewers = this.documentViewers.get(docKey);
        if (viewers) {
            viewers.delete(userId);
            if (viewers.size === 0) {
                this.documentViewers.delete(docKey);
            }
        }

        // Clear user's current document
        if (user?.currentDocument?.type === documentType && user?.currentDocument?.id === documentId) {
            const updatedUser: IOnlineUser = {
                ...user,
                currentDocument: undefined,
                lastActivity: new Date()
            };
            this.onlineUsers.set(userId, updatedUser);
        }

        // Broadcast
        if (user) {
            await this.broadcastDocumentViewers(user.tenantId, documentType, documentId);
        }

        logger.debug('User left document', { userId, documentType, documentId });
    }

    async getDocumentViewers(tenantId: string, documentType: string, documentId: string): Promise<IDocumentViewer[]> {
        const docKey = this.getDocumentKey(documentType, documentId);
        const viewerIds = this.documentViewers.get(docKey) ?? new Set();

        const viewers: IDocumentViewer[] = [];
        for (const userId of viewerIds) {
            const user = this.onlineUsers.get(userId);
            if (user?.tenantId === tenantId) {
                viewers.push({
                    userId: user.userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    joinedAt: user.lastActivity.toISOString(),
                    isEditing: false  // Would need lock check
                });
            }
        }

        return viewers;
    }

    // ==================== CLEANUP ====================

    async cleanupInactiveUsers(inactiveThresholdMs = 5 * 60 * 1000): Promise<number> {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, user] of this.onlineUsers.entries()) {
            const inactiveTime = now - user.lastActivity.getTime();

            if (inactiveTime > inactiveThresholdMs) {
                if (user.status === 'online') {
                    // Mark as away first
                    await this.setAway(userId);
                } else if (user.status === 'away' && inactiveTime > inactiveThresholdMs * 2) {
                    // If away for double the threshold, mark offline
                    await this.setOffline(userId);
                    cleaned++;
                }
            }
        }

        if (cleaned > 0) {
            logger.info('Inactive users cleaned', { count: cleaned });
        }

        return cleaned;
    }

    // ==================== HELPERS ====================

    private getDocumentKey(documentType: string, documentId: string): string {
        return `${documentType}:${documentId}`;
    }

    private async broadcastPresence(user: IOnlineUser, status: 'online' | 'away' | 'offline'): Promise<void> {
        let eventType: string;
        if (status === 'online') {
            eventType = CollaborationEvents.USER_ONLINE;
        } else if (status === 'offline') {
            eventType = CollaborationEvents.USER_OFFLINE;
        } else {
            eventType = CollaborationEvents.PRESENCE_UPDATE;
        }

        const payload: IUserPresencePayload = {
            tenantId: user.tenantId,
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            lastActivity: user.lastActivity.toISOString(),
            currentDocument: user.currentDocument
        };

        await this.eventBus.publish({
            eventId: `presence_${Date.now()}`,
            eventType,
            timestamp: new Date(),
            aggregateType: 'User',
            aggregateId: user.userId,
            payload: payload as unknown as Record<string, unknown>
        });
    }

    private async broadcastDocumentViewers(tenantId: string, documentType: string, documentId: string): Promise<void> {
        const viewers = await this.getDocumentViewers(tenantId, documentType, documentId);

        const payload: IDocumentViewersPayload = {
            tenantId,
            documentType,
            documentId,
            viewers
        };

        await this.eventBus.publish({
            eventId: `viewers_${Date.now()}`,
            eventType: CollaborationEvents.DOCUMENT_VIEWERS,
            timestamp: new Date(),
            aggregateType: 'Document',
            aggregateId: `${documentType}:${documentId}`,
            payload: payload as unknown as Record<string, unknown>
        });
    }

    private startCleanupJob(): void {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupInactiveUsers().catch(error => {
                logger.error('Presence cleanup failed', { error });
            });
        }, 60 * 1000);
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.onlineUsers.clear();
        this.documentViewers.clear();
    }
}
