/**
 * Activity Feed Service
 * Real-time activity tracking and notifications
 * Following Single Responsibility Principle (SRP)
 */
import { ICollaborationRepository, IActivityQueryOptions } from './collaboration.repository';
import { ActivityType } from '../../db/schema';
export interface IActivityFeedService {
    recordActivity(input: IActivityInput): Promise<IActivityDto>;
    getActivities(tenantId: string, options?: IActivityQueryOptions): Promise<IActivityDto[]>;
    getActivityById(activityId: string): Promise<IActivityDto | null>;
    getDocumentActivities(tenantId: string, documentType: string, documentId: string, limit?: number): Promise<IActivityDto[]>;
    getUnreadCount(tenantId: string, userId: string): Promise<number>;
    markAsRead(userId: string, activityIds: string[]): Promise<void>;
    markAllAsRead(tenantId: string, userId: string): Promise<void>;
    getMentions(tenantId: string, userId: string, limit?: number): Promise<IActivityDto[]>;
}
export interface IActivityInput {
    readonly tenantId: string;
    readonly actorId: string;
    readonly activityType: ActivityType;
    readonly targetType?: string;
    readonly targetId?: string;
    readonly metadata: IActivityMetadata;
}
export interface IActivityMetadata {
    readonly targetName?: string;
    readonly description?: string;
    readonly previousValue?: unknown;
    readonly newValue?: unknown;
    readonly mentionedUserIds?: string[];
    readonly [key: string]: unknown;
}
export interface IActivityDto {
    readonly id: string;
    readonly tenantId: string;
    readonly actorId: string;
    readonly actorName?: string;
    readonly activityType: string;
    readonly targetType?: string;
    readonly targetId?: string;
    readonly targetName?: string;
    readonly description?: string;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: Date;
}
export declare class ActivityFeedService implements IActivityFeedService {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: ICollaborationRepository);
    recordActivity(input: IActivityInput): Promise<IActivityDto>;
    getActivities(tenantId: string, options?: IActivityQueryOptions): Promise<IActivityDto[]>;
    getActivityById(activityId: string): Promise<IActivityDto | null>;
    getDocumentActivities(tenantId: string, documentType: string, documentId: string, limit?: number): Promise<IActivityDto[]>;
    getUnreadCount(tenantId: string, userId: string): Promise<number>;
    markAsRead(userId: string, activityIds: string[]): Promise<void>;
    markAllAsRead(tenantId: string, userId: string): Promise<void>;
    getMentions(tenantId: string, userId: string, limit?: number): Promise<IActivityDto[]>;
    private toActivityDto;
    private broadcastActivity;
    private processMentions;
    private getActivityMessage;
}
/**
 * Create activity input for common actions
 */
export declare const ActivityFactory: {
    orderCreated(tenantId: string, actorId: string, orderId: string, orderNumber: string): IActivityInput;
    optimizationCompleted(tenantId: string, actorId: string, scenarioId: string, scenarioName: string, wastePercentage: number): IActivityInput;
    planApproved(tenantId: string, actorId: string, planId: string, planNumber: string): IActivityInput;
    stockAlert(tenantId: string, stockItemId: string, stockCode: string, alertLevel: string): IActivityInput;
};
//# sourceMappingURL=activity-feed.service.d.ts.map