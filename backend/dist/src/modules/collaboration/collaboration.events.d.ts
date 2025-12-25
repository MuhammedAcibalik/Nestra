/**
 * Collaboration Events
 * Event definitions for real-time collaboration
 */
export declare const CollaborationEvents: {
    readonly USER_ONLINE: "collab:user_online";
    readonly USER_OFFLINE: "collab:user_offline";
    readonly USER_ACTIVITY: "collab:user_activity";
    readonly PRESENCE_UPDATE: "collab:presence_update";
    readonly DOCUMENT_JOINED: "collab:document_joined";
    readonly DOCUMENT_LEFT: "collab:document_left";
    readonly DOCUMENT_VIEWERS: "collab:document_viewers";
    readonly LOCK_ACQUIRED: "collab:lock_acquired";
    readonly LOCK_RELEASED: "collab:lock_released";
    readonly LOCK_DENIED: "collab:lock_denied";
    readonly LOCK_EXPIRED: "collab:lock_expired";
    readonly LOCK_HEARTBEAT: "collab:lock_heartbeat";
    readonly ACTIVITY_NEW: "collab:activity_new";
    readonly MENTION: "collab:mention";
    readonly COMMENT_ADDED: "collab:comment_added";
    readonly DOCUMENT_UPDATED: "collab:document_updated";
    readonly SYNC_REQUEST: "collab:sync_request";
    readonly SYNC_RESPONSE: "collab:sync_response";
};
export type CollaborationEventType = typeof CollaborationEvents[keyof typeof CollaborationEvents];
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
    readonly cursorPosition?: {
        x: number;
        y: number;
    };
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
        readonly type: string;
        readonly documentType?: string;
        readonly documentId?: string;
        readonly documentName?: string;
    };
    readonly message: string;
    readonly timestamp: string;
}
//# sourceMappingURL=collaboration.events.d.ts.map