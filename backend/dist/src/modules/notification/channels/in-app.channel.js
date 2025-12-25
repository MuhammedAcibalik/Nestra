"use strict";
/**
 * In-App Notification Channel
 * Uses existing WebSocket infrastructure for real-time delivery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppChannel = void 0;
const websocket_1 = require("../../../websocket");
const logger_1 = require("../../../core/logger");
const uuid_1 = require("uuid");
const logger = (0, logger_1.createModuleLogger)('InAppChannel');
class InAppChannel {
    name = 'in_app';
    async send(payload, recipient) {
        const notificationId = (0, uuid_1.v4)();
        try {
            // Emit via WebSocket to the specific user
            websocket_1.websocketService.emitToUser(recipient.userId, 'notification', {
                id: notificationId,
                type: payload.eventType,
                title: payload.message.title,
                body: payload.message.body,
                data: payload.message.data,
                priority: payload.priority ?? 'normal',
                timestamp: new Date().toISOString()
            });
            logger.debug('In-app notification sent', {
                userId: recipient.userId,
                eventType: payload.eventType
            });
            return {
                id: notificationId,
                channel: 'in_app',
                status: 'delivered',
                sentAt: new Date()
            };
        }
        catch (error) {
            logger.error('Failed to send in-app notification', { error, userId: recipient.userId });
            return {
                id: notificationId,
                channel: 'in_app',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    isAvailable() {
        return true; // Always available
    }
}
exports.InAppChannel = InAppChannel;
//# sourceMappingURL=in-app.channel.js.map