/**
 * Notification System Types
 * Multi-channel notification support: Email, SMS, Push, In-App
 */

// ==================== NOTIFICATION CHANNELS ====================

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'read';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// ==================== NOTIFICATION EVENTS ====================

export const NotificationEvents = {
    // Stock
    STOCK_LOW: 'stock_low',
    STOCK_CRITICAL: 'stock_critical',
    STOCK_OUT: 'stock_out',

    // Orders
    ORDER_CREATED: 'order_created',
    ORDER_STATUS_CHANGED: 'order_status_changed',
    ORDER_COMPLETED: 'order_completed',

    // Production
    PRODUCTION_STARTED: 'production_started',
    PRODUCTION_COMPLETED: 'production_completed',
    PRODUCTION_ISSUE: 'production_issue',

    // Optimization
    OPTIMIZATION_READY: 'optimization_ready',
    OPTIMIZATION_FAILED: 'optimization_failed',

    // System
    SYSTEM_MAINTENANCE: 'system_maintenance',
    SYSTEM_ALERT: 'system_alert',

    // Collaboration
    MENTION: 'mention',
    DOCUMENT_SHARED: 'document_shared',
    COMMENT_ADDED: 'comment_added'
} as const;

export type NotificationEventType = (typeof NotificationEvents)[keyof typeof NotificationEvents];

// ==================== MESSAGE INTERFACES ====================

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

// ==================== NOTIFICATION PAYLOAD ====================

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

// ==================== NOTIFICATION RESULT ====================

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

// ==================== CHANNEL INTERFACE ====================

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

// ==================== USER PREFERENCES ====================

export interface INotificationPreferences {
    readonly emailEnabled: boolean;
    readonly smsEnabled: boolean;
    readonly pushEnabled: boolean;
    readonly inAppEnabled: boolean;
    readonly events: Record<NotificationEventType, NotificationChannel[]>;
    readonly quietHours?: {
        readonly start: string; // HH:mm
        readonly end: string;
        readonly timezone: string;
    };
}

export const defaultNotificationPreferences: INotificationPreferences = {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    events: {
        [NotificationEvents.STOCK_CRITICAL]: ['email', 'push', 'in_app'],
        [NotificationEvents.STOCK_LOW]: ['in_app'],
        [NotificationEvents.STOCK_OUT]: ['email', 'push', 'in_app'],
        [NotificationEvents.ORDER_CREATED]: ['in_app'],
        [NotificationEvents.ORDER_STATUS_CHANGED]: ['in_app'],
        [NotificationEvents.ORDER_COMPLETED]: ['in_app'],
        [NotificationEvents.PRODUCTION_STARTED]: ['in_app'],
        [NotificationEvents.PRODUCTION_COMPLETED]: ['push', 'in_app'],
        [NotificationEvents.PRODUCTION_ISSUE]: ['email', 'push', 'in_app'],
        [NotificationEvents.OPTIMIZATION_READY]: ['push', 'in_app'],
        [NotificationEvents.OPTIMIZATION_FAILED]: ['email', 'in_app'],
        [NotificationEvents.SYSTEM_MAINTENANCE]: ['email', 'push'],
        [NotificationEvents.SYSTEM_ALERT]: ['email', 'push', 'in_app'],
        [NotificationEvents.MENTION]: ['push', 'in_app'],
        [NotificationEvents.DOCUMENT_SHARED]: ['in_app'],
        [NotificationEvents.COMMENT_ADDED]: ['in_app']
    }
};

// ==================== CONFIGURATION ====================

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

export const defaultNotificationConfig: INotificationConfig = {
    enabled: true,
    defaultChannel: 'in_app'
};
