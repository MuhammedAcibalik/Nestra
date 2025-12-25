/**
 * In-App Notification Channel
 * Uses existing WebSocket infrastructure for real-time delivery
 */

import {
    INotificationChannel,
    INotificationPayload,
    INotificationResult,
    IRecipient,
    NotificationChannel
} from '../types';
import { websocketService } from '../../../websocket';
import { createModuleLogger } from '../../../core/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createModuleLogger('InAppChannel');

export class InAppChannel implements INotificationChannel {
    readonly name: NotificationChannel = 'in_app';

    async send(payload: INotificationPayload, recipient: IRecipient): Promise<INotificationResult> {
        const notificationId = uuidv4();

        try {
            // Emit via WebSocket to the specific user
            websocketService.emitToUser(recipient.userId, 'notification', {
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
        } catch (error) {
            logger.error('Failed to send in-app notification', { error, userId: recipient.userId });

            return {
                id: notificationId,
                channel: 'in_app',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    isAvailable(): boolean {
        return true; // Always available
    }
}
