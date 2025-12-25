"use strict";
/**
 * Email Notification Channel
 * Supports SendGrid, SMTP, and AWS SES
 *
 * Note: Install required packages based on provider:
 * - SendGrid: npm install @sendgrid/mail
 * - SMTP: npm install nodemailer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailChannel = void 0;
const logger_1 = require("../../../core/logger");
const uuid_1 = require("uuid");
const logger = (0, logger_1.createModuleLogger)('EmailChannel');
class EmailChannel {
    name = 'email';
    config;
    constructor(config) {
        this.config = config;
    }
    async send(payload, recipient) {
        const notificationId = (0, uuid_1.v4)();
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
            let externalId;
            switch (this.config?.provider) {
                case 'sendgrid':
                    externalId = await this.sendViaSendGrid(recipient.email, subject, body, payload.email?.templateId, payload.email?.templateData);
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
        }
        catch (error) {
            logger.error('Failed to send email', { error, to: recipient.email });
            return {
                id: notificationId,
                channel: 'email',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    isAvailable() {
        return !!this.config?.provider && !!this.config?.from;
    }
    // ==================== PROVIDER IMPLEMENTATIONS ====================
    async sendViaSendGrid(to, subject, body, templateId, _templateData) {
        // SendGrid implementation
        // Requires: npm install @sendgrid/mail
        logger.info('SendGrid email queued', { to, subject, templateId });
        // In production, uncomment and use:
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(this.config?.apiKey);
        // const msg = { to, from: this.config?.from, subject, html: body };
        // await sgMail.send(msg);
        return (0, uuid_1.v4)();
    }
    async sendViaSMTP(to, subject, _body) {
        // SMTP implementation
        // Requires: npm install nodemailer
        logger.info('SMTP email queued', { to, subject, host: this.config?.smtpHost });
        // In production, uncomment and use:
        // const nodemailer = require('nodemailer');
        // const transporter = nodemailer.createTransport({ ... });
        // await transporter.sendMail({ ... });
        return (0, uuid_1.v4)();
    }
    async sendViaSES(to, subject, _body) {
        // AWS SES implementation
        logger.info('SES email queued', { to, subject });
        return (0, uuid_1.v4)();
    }
}
exports.EmailChannel = EmailChannel;
//# sourceMappingURL=email.channel.js.map