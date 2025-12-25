/**
 * Collaboration Events
 * Event definitions for real-time collaboration
 */

// ==================== EVENT TYPES ====================

export const CollaborationEvents = {
    // Presence
    USER_ONLINE: 'collab:user_online',
    USER_OFFLINE: 'collab:user_offline',
    USER_ACTIVITY: 'collab:user_activity',
    PRESENCE_UPDATE: 'collab:presence_update',

    // Document viewing
    DOCUMENT_JOINED: 'collab:document_joined',
    DOCUMENT_LEFT: 'collab:document_left',
    DOCUMENT_VIEWERS: 'collab:document_viewers',

    // Locking
    LOCK_ACQUIRED: 'collab:lock_acquired',
    LOCK_RELEASED: 'collab:lock_released',
    LOCK_DENIED: 'collab:lock_denied',
    LOCK_EXPIRED: 'collab:lock_expired',
    LOCK_HEARTBEAT: 'collab:lock_heartbeat',

    // Activity
    ACTIVITY_NEW: 'collab:activity_new',
    MENTION: 'collab:mention',
    COMMENT_ADDED: 'collab:comment_added',

    // Sync
    DOCUMENT_UPDATED: 'collab:document_updated',
    SYNC_REQUEST: 'collab:sync_request',
    SYNC_RESPONSE: 'collab:sync_response',
} as const;

export type CollaborationEventType = typeof CollaborationEvents[keyof typeof CollaborationEvents];

// ==================== PAYLOAD INTERFACES ====================

export interface IUserPresencePayload {
    readonly tenantId: string;
    readonly userId: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly status: 'online' | 'away' | 'offline';
    readonly lastActivity: string;
    readonly currentDocument?: {
        readonly type: string;
        readonly id: string;
        readonly name?: string;
    };
}

export interface IDocumentViewersPayload {
    readonly tenantId: string;
    readonly documentType: string;
    readonly documentId: string;
    readonly viewers: IDocumentViewer[];
}

export interface IDocumentViewer {
    readonly userId: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly joinedAt: string;
    readonly isEditing: boolean;
    readonly cursorPosition?: { x: number; y: number };
}

export interface ILockEventPayload {
    readonly tenantId: string;
    readonly documentType: string;
    readonly documentId: string;
    readonly lockedBy?: {
        readonly userId: string;
        readonly email: string;
        readonly firstName: string;
        readonly lastName: string;
    };
    readonly lockedAt?: string;
    readonly expiresAt?: string;
    readonly reason?: string;
}

export interface IDocumentUpdatePayload {
    readonly tenantId: string;
    readonly documentType: string;
    readonly documentId: string;
    readonly updatedBy: {
        readonly userId: string;
        readonly name: string;
    };
    readonly changeType: 'created' | 'updated' | 'deleted' | 'status_changed';
    readonly changes?: Record<string, unknown>;
    readonly timestamp: string;
}

export interface IActivityEvent {
    readonly tenantId: string;
    readonly activityId: string;
    readonly activityType: string;
    readonly actor: {
        readonly userId: string;
        readonly name: string;
    };
    readonly target?: {
        readonly type: string;
        readonly id: string;
        readonly name?: string;
    };
    readonly message: string;
    readonly metadata?: Record<string, unknown>;
    readonly timestamp: string;
}

export interface IMentionPayload {
    readonly tenantId: string;
    readonly mentionedUserId: string;
    readonly mentionedBy: {
        readonly userId: string;
        readonly name: string;
    };
    readonly context: {
        readonly type: string;  // 'comment', 'activity', etc.
        readonly documentType?: string;
        readonly documentId?: string;
        readonly documentName?: string;
    };
    readonly message: string;
    readonly timestamp: string;
}
