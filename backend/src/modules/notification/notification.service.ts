/**
 * Notification Service
 * Centralized service for multi-channel notifications
 */

import {
    INotificationPayload,
    INotificationChannel,
    INotificationResult,
    ISendResult,
    IRecipient,
    NotificationChannel,
    INotificationConfig,
    INotificationPreferences,
    defaultNotificationPreferences,
    defaultNotificationConfig,
    NotificationEventType
} from './types';
import { InAppChannel, EmailChannel } from './channels';
import { EventBus } from '../../core/events/event-bus';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('NotificationService');

// ==================== SERVICE INTERFACE ====================

export interface INotificationService {
    /**
     * Send notification to a user
     */
    send(payload: INotificationPayload, recipient: IRecipient): Promise<ISendResult>;

    /**
     * Send notification to multiple users
     */
    sendMany(payload: INotificationPayload, recipients: IRecipient[]): Promise<ISendResult[]>;

    /**
     * Check if a channel is available
     */
    isChannelAvailable(channel: NotificationChannel): boolean;

    /**
     * Get active channels
     */
    getActiveChannels(): NotificationChannel[];
}

// ==================== SERVICE IMPLEMENTATION ====================

export class NotificationService implements INotificationService {
    private readonly channels: Map<NotificationChannel, INotificationChannel> = new Map();
    private readonly eventBus: EventBus;
    private readonly config: INotificationConfig;

    constructor(config?: Partial<INotificationConfig>) {
        this.config = { ...defaultNotificationConfig, ...config };
        this.eventBus = EventBus.getInstance();
        this.initializeChannels();
    }

    private initializeChannels(): void {
        // Always add in-app channel
        this.channels.set('in_app', new InAppChannel());

        // Add email channel if configured
        if (this.config.email) {
            this.channels.set('email', new EmailChannel(this.config.email));
        }

        // SMS and Push channels can be added here when implemented
        // if (this.config.sms) {
        //     this.channels.set('sms', new SmsChannel(this.config.sms));
        // }
        // if (this.config.push) {
        //     this.channels.set('push', new PushChannel(this.config.push));
        // }

        logger.info('Notification channels initialized', {
            channels: Array.from(this.channels.keys())
        });
    }

    async send(payload: INotificationPayload, recipient: IRecipient): Promise<ISendResult> {
        if (!this.config.enabled) {
            return { success: true, results: [] };
        }

        const preferences = recipient.preferences ?? defaultNotificationPreferences;
        const channelsToUse = this.determineChannels(payload, preferences);

        const results: INotificationResult[] = [];
        const errors: string[] = [];

        for (const channelName of channelsToUse) {
            const channel = this.channels.get(channelName);

            if (!channel || !channel.isAvailable()) {
                continue;
            }

            try {
                const result = await channel.send(payload, recipient);
                results.push(result);

                if (result.status === 'failed' && result.error) {
                    errors.push(`${channelName}: ${result.error}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${channelName}: ${errorMessage}`);
                logger.error('Channel send failed', { channel: channelName, error });
            }
        }

        // Emit notification event for tracking
        await this.emitNotificationEvent(payload, recipient, results);

        return {
            success: errors.length === 0,
            results,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    async sendMany(payload: INotificationPayload, recipients: IRecipient[]): Promise<ISendResult[]> {
        return Promise.all(recipients.map((recipient) => this.send(payload, recipient)));
    }

    isChannelAvailable(channel: NotificationChannel): boolean {
        return this.channels.get(channel)?.isAvailable() ?? false;
    }

    getActiveChannels(): NotificationChannel[] {
        return Array.from(this.channels.entries())
            .filter(([, channel]) => channel.isAvailable())
            .map(([name]) => name);
    }

    // ==================== HELPERS ====================

    private determineChannels(
        payload: INotificationPayload,
        preferences: INotificationPreferences
    ): NotificationChannel[] {
        // If channels explicitly specified in payload, use those
        if (payload.channels && payload.channels.length > 0) {
            return payload.channels.filter((ch) => this.isChannelEnabled(ch, preferences));
        }

        // Otherwise, use preferences for this event type
        const eventChannels = preferences.events[payload.eventType as NotificationEventType];
        if (eventChannels) {
            return eventChannels.filter((ch) => this.isChannelEnabled(ch, preferences));
        }

        // Default to in-app
        return ['in_app'];
    }

    private isChannelEnabled(channel: NotificationChannel, preferences: INotificationPreferences): boolean {
        switch (channel) {
            case 'email':
                return preferences.emailEnabled;
            case 'sms':
                return preferences.smsEnabled;
            case 'push':
                return preferences.pushEnabled;
            case 'in_app':
                return preferences.inAppEnabled;
            default:
                return false;
        }
    }

    private async emitNotificationEvent(
        payload: INotificationPayload,
        recipient: IRecipient,
        results: INotificationResult[]
    ): Promise<void> {
        await this.eventBus.publish({
            eventId: `notification_${Date.now()}`,
            eventType: 'notification.sent',
            timestamp: new Date(),
            aggregateType: 'Notification',
            aggregateId: recipient.userId,
            payload: {
                tenantId: payload.tenantId,
                userId: recipient.userId,
                eventType: payload.eventType,
                channels: results.map((r) => r.channel),
                success: results.every((r) => r.status !== 'failed')
            }
        });
    }
}

// ==================== SINGLETON INSTANCE ====================

let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService | null {
    return notificationServiceInstance;
}

export function initializeNotificationService(config?: Partial<INotificationConfig>): NotificationService {
    notificationServiceInstance = new NotificationService(config);
    return notificationServiceInstance;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Quick notification send function
 */
export async function notify(payload: INotificationPayload, recipient: IRecipient): Promise<ISendResult> {
    const service = getNotificationService();
    if (!service) {
        logger.warn('Notification service not initialized');
        return { success: false, results: [], errors: ['Service not initialized'] };
    }
    return service.send(payload, recipient);
}
