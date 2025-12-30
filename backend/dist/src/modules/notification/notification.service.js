"use strict";
/**
 * Notification Service
 * Centralized service for multi-channel notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
exports.getNotificationService = getNotificationService;
exports.initializeNotificationService = initializeNotificationService;
exports.notify = notify;
const types_1 = require("./types");
const channels_1 = require("./channels");
const event_bus_1 = require("../../core/events/event-bus");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('NotificationService');
// ==================== SERVICE IMPLEMENTATION ====================
class NotificationService {
    channels = new Map();
    eventBus;
    config;
    constructor(config) {
        this.config = { ...types_1.defaultNotificationConfig, ...config };
        this.eventBus = event_bus_1.EventBus.getInstance();
        this.initializeChannels();
    }
    initializeChannels() {
        // Always add in-app channel
        this.channels.set('in_app', new channels_1.InAppChannel());
        // Add email channel if configured
        if (this.config.email) {
            this.channels.set('email', new channels_1.EmailChannel(this.config.email));
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
    async send(payload, recipient) {
        if (!this.config.enabled) {
            return { success: true, results: [] };
        }
        const preferences = recipient.preferences ?? types_1.defaultNotificationPreferences;
        const channelsToUse = this.determineChannels(payload, preferences);
        const results = [];
        const errors = [];
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
            }
            catch (error) {
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
    async sendMany(payload, recipients) {
        return Promise.all(recipients.map((recipient) => this.send(payload, recipient)));
    }
    isChannelAvailable(channel) {
        return this.channels.get(channel)?.isAvailable() ?? false;
    }
    getActiveChannels() {
        return Array.from(this.channels.entries())
            .filter(([, channel]) => channel.isAvailable())
            .map(([name]) => name);
    }
    // ==================== HELPERS ====================
    determineChannels(payload, preferences) {
        // If channels explicitly specified in payload, use those
        if (payload.channels && payload.channels.length > 0) {
            return payload.channels.filter((ch) => this.isChannelEnabled(ch, preferences));
        }
        // Otherwise, use preferences for this event type
        const eventChannels = preferences.events[payload.eventType];
        if (eventChannels) {
            return eventChannels.filter((ch) => this.isChannelEnabled(ch, preferences));
        }
        // Default to in-app
        return ['in_app'];
    }
    isChannelEnabled(channel, preferences) {
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
    async emitNotificationEvent(payload, recipient, results) {
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
exports.NotificationService = NotificationService;
// ==================== SINGLETON INSTANCE ====================
let notificationServiceInstance = null;
function getNotificationService() {
    return notificationServiceInstance;
}
function initializeNotificationService(config) {
    notificationServiceInstance = new NotificationService(config);
    return notificationServiceInstance;
}
// ==================== HELPER FUNCTIONS ====================
/**
 * Quick notification send function
 */
async function notify(payload, recipient) {
    const service = getNotificationService();
    if (!service) {
        logger.warn('Notification service not initialized');
        return { success: false, results: [], errors: ['Service not initialized'] };
    }
    return service.send(payload, recipient);
}
//# sourceMappingURL=notification.service.js.map