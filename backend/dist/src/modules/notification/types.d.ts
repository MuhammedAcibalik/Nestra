/**
 * Notification System Types
 * Multi-channel notification support: Email, SMS, Push, In-App
 */
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'read';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export declare const NotificationEvents: {
    readonly STOCK_LOW: "stock_low";
    readonly STOCK_CRITICAL: "stock_critical";
    readonly STOCK_OUT: "stock_out";
    readonly ORDER_CREATED: "order_created";
    readonly ORDER_STATUS_CHANGED: "order_status_changed";
    readonly ORDER_COMPLETED: "order_completed";
    readonly PRODUCTION_STARTED: "production_started";
    readonly PRODUCTION_COMPLETED: "production_completed";
    readonly PRODUCTION_ISSUE: "production_issue";
    readonly OPTIMIZATION_READY: "optimization_ready";
    readonly OPTIMIZATION_FAILED: "optimization_failed";
    readonly SYSTEM_MAINTENANCE: "system_maintenance";
    readonly SYSTEM_ALERT: "system_alert";
    readonly MENTION: "mention";
    readonly DOCUMENT_SHARED: "document_shared";
    readonly COMMENT_ADDED: "comment_added";
};
export type NotificationEventType = typeof NotificationEvents[keyof typeof NotificationEvents];
export interface INotificationMessage {
    readonly title: string;
    readonly body: string;
    readonly data?: Record<string, unknown>;
}
export interface IEmailOptions {
    readonly subject: string;
    readonly html?: string;
    readonly text?: string;
    readonly templateId?: string;
    readonly templateData?: Record<string, unknown>;
    readonly attachments?: IEmailAttachment[];
}
export interface IEmailAttachment {
    readonly filename: string;
    readonly content: string | Buffer;
    readonly contentType?: string;
}
export interface ISmsOptions {
    readonly body: string;
}
export interface IPushOptions {
    readonly title: string;
    readonly body: string;
    readonly icon?: string;
    readonly badge?: number;
    readonly sound?: string;
    readonly data?: Record<string, unknown>;
    readonly clickAction?: string;
}
export interface INotificationPayload {
    readonly tenantId: string;
    readonly userId: string;
    readonly eventType: NotificationEventType;
    readonly priority?: NotificationPriority;
    readonly channels?: NotificationChannel[];
    readonly message: INotificationMessage;
    readonly email?: IEmailOptions;
    readonly sms?: ISmsOptions;
    readonly push?: IPushOptions;
    readonly metadata?: Record<string, unknown>;
    readonly scheduledAt?: Date;
}
export interface INotificationResult {
    readonly id: string;
    readonly channel: NotificationChannel;
    readonly status: NotificationStatus;
    readonly sentAt?: Date;
    readonly externalId?: string;
    readonly error?: string;
}
export interface ISendResult {
    readonly success: boolean;
    readonly results: INotificationResult[];
    readonly errors?: string[];
}
export interface INotificationChannel {
    readonly name: NotificationChannel;
    /**
     * Send notification through this channel
     */
    send(payload: INotificationPayload, recipient: IRecipient): Promise<INotificationResult>;
    /**
     * Check if channel is configured and available
     */
    isAvailable(): boolean;
}
export interface IRecipient {
    readonly userId: string;
    readonly email?: string;
    readonly phone?: string;
    readonly pushToken?: string;
    readonly preferences?: INotificationPreferences;
}
export interface INotificationPreferences {
    readonly emailEnabled: boolean;
    readonly smsEnabled: boolean;
    readonly pushEnabled: boolean;
    readonly inAppEnabled: boolean;
    readonly events: Record<NotificationEventType, NotificationChannel[]>;
    readonly quietHours?: {
        readonly start: string;
        readonly end: string;
        readonly timezone: string;
    };
}
export declare const defaultNotificationPreferences: INotificationPreferences;
export interface INotificationConfig {
    readonly enabled: boolean;
    readonly defaultChannel: NotificationChannel;
    readonly email?: {
        readonly provider: 'sendgrid' | 'smtp' | 'ses';
        readonly from: string;
        readonly fromName?: string;
        readonly apiKey?: string;
        readonly smtpHost?: string;
        readonly smtpPort?: number;
        readonly smtpUser?: string;
        readonly smtpPass?: string;
    };
    readonly sms?: {
        readonly provider: 'twilio' | 'nexmo';
        readonly from: string;
        readonly accountSid?: string;
        readonly authToken?: string;
    };
    readonly push?: {
        readonly provider: 'fcm';
        readonly serviceAccountPath?: string;
    };
}
export declare const defaultNotificationConfig: INotificationConfig;
//# sourceMappingURL=types.d.ts.map