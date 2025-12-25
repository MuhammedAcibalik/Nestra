/**
 * In-App Notification Channel
 * Uses existing WebSocket infrastructure for real-time delivery
 */
import { INotificationChannel, INotificationPayload, INotificationResult, IRecipient, NotificationChannel } from '../types';
export declare class InAppChannel implements INotificationChannel {
    readonly name: NotificationChannel;
    send(payload: INotificationPayload, recipient: IRecipient): Promise<INotificationResult>;
    isAvailable(): boolean;
}
//# sourceMappingURL=in-app.channel.d.ts.map