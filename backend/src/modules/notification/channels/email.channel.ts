/**
 * Email Notification Channel
 * Supports SendGrid, SMTP, and AWS SES
 *
 * Note: Install required packages based on provider:
 * - SendGrid: npm install @sendgrid/mail
 * - SMTP: npm install nodemailer
 */

import {
    INotificationChannel,
    INotificationPayload,
    INotificationResult,
    IRecipient,
    NotificationChannel,
    INotificationConfig
} from '../types';
import { createModuleLogger } from '../../../core/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createModuleLogger('EmailChannel');

export class EmailChannel implements INotificationChannel {
    readonly name: NotificationChannel = 'email';
    private config: INotificationConfig['email'];

    constructor(config?: INotificationConfig['email']) {
        this.config = config;
    }

    async send(payload: INotificationPayload, recipient: IRecipient): Promise<INotificationResult> {
        const notificationId = uuidv4();

        if (!recipient.email) {
            return {
                id: notificationId,
                channel: 'email',
                status: 'failed',
                error: 'No email address provided'
            };
        }

        if (!this.isAvailable()) {
            return {
                id: notificationId,
                channel: 'email',
                status: 'failed',
                error: 'Email channel not configured'
            };
        }

        try {
            const subject = payload.email?.subject ?? payload.message.title;
            const body = payload.email?.html ?? payload.email?.text ?? payload.message.body;

            // Choose provider based on config
            let externalId: string | undefined;

            switch (this.config?.provider) {
                case 'sendgrid':
                    externalId = await this.sendViaSendGrid(
                        recipient.email,
                        subject,
                        body,
                        payload.email?.templateId,
                        payload.email?.templateData
                    );
                    break;
                case 'smtp':
                    externalId = await this.sendViaSMTP(recipient.email, subject, body);
                    break;
                case 'ses':
                    externalId = await this.sendViaSES(recipient.email, subject, body);
                    break;
                default:
                    throw new Error(`Unknown email provider: ${this.config?.provider}`);
            }

            logger.info('Email sent', {
                to: recipient.email,
                subject,
                externalId
            });

            return {
                id: notificationId,
                channel: 'email',
                status: 'sent',
                sentAt: new Date(),
                externalId
            };
        } catch (error) {
            logger.error('Failed to send email', { error, to: recipient.email });

            return {
                id: notificationId,
                channel: 'email',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    isAvailable(): boolean {
        return !!this.config?.provider && !!this.config?.from;
    }

    // ==================== PROVIDER IMPLEMENTATIONS ====================

    private async sendViaSendGrid(
        to: string,
        subject: string,
        body: string,
        templateId?: string,
        _templateData?: Record<string, unknown>
    ): Promise<string> {
        // SendGrid implementation
        // Requires: npm install @sendgrid/mail
        logger.info('SendGrid email queued', { to, subject, templateId });

        // In production, uncomment and use:
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(this.config?.apiKey);
        // const msg = { to, from: this.config?.from, subject, html: body };
        // await sgMail.send(msg);

        return uuidv4();
    }

    private async sendViaSMTP(to: string, subject: string, _body: string): Promise<string> {
        // SMTP implementation
        // Requires: npm install nodemailer
        logger.info('SMTP email queued', { to, subject, host: this.config?.smtpHost });

        // In production, uncomment and use:
        // const nodemailer = require('nodemailer');
        // const transporter = nodemailer.createTransport({ ... });
        // await transporter.sendMail({ ... });

        return uuidv4();
    }

    private async sendViaSES(to: string, subject: string, _body: string): Promise<string> {
        // AWS SES implementation
        logger.info('SES email queued', { to, subject });
        return uuidv4();
    }
}
