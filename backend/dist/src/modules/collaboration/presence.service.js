"use strict";
/**
 * Presence Service
 * Tracks online users and their current activities
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const event_bus_1 = require("../../core/events/event-bus");
const logger_1 = require("../../core/logger");
const collaboration_events_1 = require("./collaboration.events");
const logger = (0, logger_1.createModuleLogger)('PresenceService');
// ==================== SERVICE ====================
class PresenceService {
    eventBus;
    // In-memory presence store (in production, use Redis)
    onlineUsers = new Map();
    documentViewers = new Map(); // docKey -> userIds
    cleanupInterval = null;
    constructor() {
        this.eventBus = event_bus_1.EventBus.getInstance();
        this.startCleanupJob();
    }
    // ==================== USER PRESENCE ====================
    async setOnline(userId, tenantId, metadata) {
        const user = {
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
    async setAway(userId) {
        const user = this.onlineUsers.get(userId);
        if (user) {
            const updatedUser = {
                ...user,
                status: 'away',
                lastActivity: new Date()
            };
            this.onlineUsers.set(userId, updatedUser);
            await this.broadcastPresence(updatedUser, 'away');
        }
    }
    async setOffline(userId) {
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
    async updateActivity(userId) {
        const user = this.onlineUsers.get(userId);
        if (user) {
            const updatedUser = {
                ...user,
                status: 'online',
                lastActivity: new Date()
            };
            this.onlineUsers.set(userId, updatedUser);
        }
    }
    // ==================== QUERIES ====================
    async getOnlineUsers(tenantId) {
        const users = [];
        for (const user of this.onlineUsers.values()) {
            if (user.tenantId === tenantId && user.status !== 'offline') {
                users.push(user);
            }
        }
        return users;
    }
    async isUserOnline(userId) {
        const user = this.onlineUsers.get(userId);
        return user?.status === 'online';
    }
    async getUserPresence(userId) {
        return this.onlineUsers.get(userId) ?? null;
    }
    // ==================== DOCUMENT PRESENCE ====================
    async joinDocument(userId, documentType, documentId) {
        const user = this.onlineUsers.get(userId);
        if (!user)
            return;
        // Leave previous document if any
        if (user.currentDocument) {
            await this.leaveDocument(userId, user.currentDocument.type, user.currentDocument.id);
        }
        // Update user's current document
        const updatedUser = {
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
    async leaveDocument(userId, documentType, documentId) {
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
            const updatedUser = {
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
    async getDocumentViewers(tenantId, documentType, documentId) {
        const docKey = this.getDocumentKey(documentType, documentId);
        const viewerIds = this.documentViewers.get(docKey) ?? new Set();
        const viewers = [];
        for (const userId of viewerIds) {
            const user = this.onlineUsers.get(userId);
            if (user?.tenantId === tenantId) {
                viewers.push({
                    userId: user.userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    joinedAt: user.lastActivity.toISOString(),
                    isEditing: false // Would need lock check
                });
            }
        }
        return viewers;
    }
    // ==================== CLEANUP ====================
    async cleanupInactiveUsers(inactiveThresholdMs = 5 * 60 * 1000) {
        const now = Date.now();
        let cleaned = 0;
        for (const [userId, user] of this.onlineUsers.entries()) {
            const inactiveTime = now - user.lastActivity.getTime();
            if (inactiveTime > inactiveThresholdMs) {
                if (user.status === 'online') {
                    // Mark as away first
                    await this.setAway(userId);
                }
                else if (user.status === 'away' && inactiveTime > inactiveThresholdMs * 2) {
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
    getDocumentKey(documentType, documentId) {
        return `${documentType}:${documentId}`;
    }
    async broadcastPresence(user, status) {
        let eventType;
        if (status === 'online') {
            eventType = collaboration_events_1.CollaborationEvents.USER_ONLINE;
        }
        else if (status === 'offline') {
            eventType = collaboration_events_1.CollaborationEvents.USER_OFFLINE;
        }
        else {
            eventType = collaboration_events_1.CollaborationEvents.PRESENCE_UPDATE;
        }
        const payload = {
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
            payload: payload
        });
    }
    async broadcastDocumentViewers(tenantId, documentType, documentId) {
        const viewers = await this.getDocumentViewers(tenantId, documentType, documentId);
        const payload = {
            tenantId,
            documentType,
            documentId,
            viewers
        };
        await this.eventBus.publish({
            eventId: `viewers_${Date.now()}`,
            eventType: collaboration_events_1.CollaborationEvents.DOCUMENT_VIEWERS,
            timestamp: new Date(),
            aggregateType: 'Document',
            aggregateId: `${documentType}:${documentId}`,
            payload: payload
        });
    }
    startCleanupJob() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupInactiveUsers().catch(error => {
                logger.error('Presence cleanup failed', { error });
            });
        }, 60 * 1000);
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.onlineUsers.clear();
        this.documentViewers.clear();
    }
}
exports.PresenceService = PresenceService;
//# sourceMappingURL=presence.service.js.map