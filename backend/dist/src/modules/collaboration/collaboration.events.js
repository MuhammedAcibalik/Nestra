"use strict";
/**
 * Collaboration Events
 * Event definitions for real-time collaboration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationEvents = void 0;
// ==================== EVENT TYPES ====================
exports.CollaborationEvents = {
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
    SYNC_RESPONSE: 'collab:sync_response'
};
//# sourceMappingURL=collaboration.events.js.map