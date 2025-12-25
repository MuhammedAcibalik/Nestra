/**
 * Email Notification Channel
 * Supports SendGrid, SMTP, and AWS SES
 *
 * Note: Install required packages based on provider:
 * - SendGrid: npm install @sendgrid/mail
 * - SMTP: npm install nodemailer
 */
import { INotificationChannel, INotificationPayload, INotificationResult, IRecipient, NotificationChannel, INotificationConfig } from '../types';
export declare class EmailChannel implements INotificationChannel {
    readonly name: NotificationChannel;
    private config;
    constructor(config?: INotificationConfig['email']);
    send(payload: INotificationPayload, recipient: IRecipient): Promise<INotificationResult>;
    isAvailable(): boolean;
    private sendViaSendGrid;
    private sendViaSMTP;
    private sendViaSES;
}
//# sourceMappingURL=email.channel.d.ts.map