/**
 * Notification Service
 * Centralized service for multi-channel notifications
 */
import { INotificationPayload, ISendResult, IRecipient, NotificationChannel, INotificationConfig } from './types';
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
export declare class NotificationService implements INotificationService {
    private readonly channels;
    private readonly eventBus;
    private readonly config;
    constructor(config?: Partial<INotificationConfig>);
    private initializeChannels;
    send(payload: INotificationPayload, recipient: IRecipient): Promise<ISendResult>;
    sendMany(payload: INotificationPayload, recipients: IRecipient[]): Promise<ISendResult[]>;
    isChannelAvailable(channel: NotificationChannel): boolean;
    getActiveChannels(): NotificationChannel[];
    private determineChannels;
    private isChannelEnabled;
    private emitNotificationEvent;
}
export declare function getNotificationService(): NotificationService | null;
export declare function initializeNotificationService(config?: Partial<INotificationConfig>): NotificationService;
/**
 * Quick notification send function
 */
export declare function notify(payload: INotificationPayload, recipient: IRecipient): Promise<ISendResult>;
//# sourceMappingURL=notification.service.d.ts.map