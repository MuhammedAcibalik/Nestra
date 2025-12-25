/**
 * Activity Feed Service
 * Real-time activity tracking and notifications
 * Following Single Responsibility Principle (SRP)
 */

import { EventBus } from '../../core/events/event-bus';
import { createModuleLogger } from '../../core/logger';
import { ICollaborationRepository, IActivityQueryOptions } from './collaboration.repository';
import { CollaborationEvents, IActivityEvent, IMentionPayload } from './collaboration.events';
import { Activity, ActivityType } from '../../db/schema';

const logger = createModuleLogger('ActivityFeedService');

// ==================== INTERFACES ====================

export interface IActivityFeedService {
    // Record activity
    recordActivity(input: IActivityInput): Promise<IActivityDto>;

    // Query activities
    getActivities(tenantId: string, options?: IActivityQueryOptions): Promise<IActivityDto[]>;
    getActivityById(activityId: string): Promise<IActivityDto | null>;

    // Document activities
    getDocumentActivities(
        tenantId: string,
        documentType: string,
        documentId: string,
        limit?: number
    ): Promise<IActivityDto[]>;

    // Unread management
    getUnreadCount(tenantId: string, userId: string): Promise<number>;
    markAsRead(userId: string, activityIds: string[]): Promise<void>;
    markAllAsRead(tenantId: string, userId: string): Promise<void>;

    // Mentions
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

// ==================== SERVICE ====================

export class ActivityFeedService implements IActivityFeedService {
    private readonly eventBus: EventBus;

    constructor(private readonly repository: ICollaborationRepository) {
        this.eventBus = EventBus.getInstance();
    }

    // ==================== RECORD ACTIVITY ====================

    async recordActivity(input: IActivityInput): Promise<IActivityDto> {
        try {
            // Create activity record
            const activity = await this.repository.createActivity({
                tenantId: input.tenantId,
                actorId: input.actorId,
                activityType: input.activityType,
                targetType: input.targetType,
                targetId: input.targetId,
                metadata: input.metadata
            });

            const dto = this.toActivityDto(activity);

            // Broadcast activity event
            await this.broadcastActivity(dto);

            // Handle mentions
            if (input.metadata.mentionedUserIds && input.metadata.mentionedUserIds.length > 0) {
                await this.processMentions(
                    input.tenantId,
                    input.actorId,
                    input.metadata.mentionedUserIds,
                    input.targetType,
                    input.targetId,
                    input.metadata.targetName
                );
            }

            logger.debug('Activity recorded', {
                id: activity.id,
                type: activity.activityType,
                actor: activity.actorId
            });

            return dto;
        } catch (error) {
            logger.error('Failed to record activity', { error, input });
            throw error;
        }
    }

    // ==================== QUERY ACTIVITIES ====================

    async getActivities(tenantId: string, options?: IActivityQueryOptions): Promise<IActivityDto[]> {
        const activities = await this.repository.getActivities(tenantId, options ?? {});
        return activities.map((a) => this.toActivityDto(a));
    }

    async getActivityById(activityId: string): Promise<IActivityDto | null> {
        const activity = await this.repository.getActivityById(activityId);
        return activity ? this.toActivityDto(activity) : null;
    }

    async getDocumentActivities(
        tenantId: string,
        documentType: string,
        documentId: string,
        limit = 20
    ): Promise<IActivityDto[]> {
        const activities = await this.repository.getActivities(tenantId, {
            targetType: documentType,
            targetId: documentId,
            limit
        });
        return activities.map((a) => this.toActivityDto(a));
    }

    // ==================== UNREAD MANAGEMENT ====================

    async getUnreadCount(tenantId: string, userId: string): Promise<number> {
        return this.repository.getUnreadCount(tenantId, userId);
    }

    async markAsRead(userId: string, activityIds: string[]): Promise<void> {
        for (const activityId of activityIds) {
            await this.repository.markAsRead(activityId, userId);
        }
    }

    async markAllAsRead(tenantId: string, userId: string): Promise<void> {
        await this.repository.markAllAsRead(tenantId, userId);
    }

    // ==================== MENTIONS ====================

    async getMentions(tenantId: string, userId: string, limit = 20): Promise<IActivityDto[]> {
        // Get activities where this user was mentioned
        const activities = await this.repository.getActivities(tenantId, {
            userId,
            limit
        });

        // Filter to only those with mentions (would need schema support)
        return activities.map((a) => this.toActivityDto(a));
    }

    // ==================== HELPERS ====================

    private toActivityDto(activity: Activity): IActivityDto {
        const metadata = activity.metadata as IActivityMetadata;
        const actorInfo = activity as Activity & {
            actor?: { firstName?: string; lastName?: string };
        };

        return {
            id: activity.id,
            tenantId: activity.tenantId,
            actorId: activity.actorId,
            actorName: actorInfo.actor
                ? `${actorInfo.actor.firstName ?? ''} ${actorInfo.actor.lastName ?? ''}`.trim()
                : undefined,
            activityType: activity.activityType,
            targetType: activity.targetType ?? undefined,
            targetId: activity.targetId ?? undefined,
            targetName: metadata.targetName,
            description: metadata.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt
        };
    }

    private async broadcastActivity(activity: IActivityDto): Promise<void> {
        const payload: IActivityEvent = {
            tenantId: activity.tenantId,
            activityId: activity.id,
            activityType: activity.activityType,
            actor: {
                userId: activity.actorId,
                name: activity.actorName ?? 'Unknown'
            },
            target:
                activity.targetType && activity.targetId
                    ? {
                          type: activity.targetType,
                          id: activity.targetId,
                          name: activity.targetName
                      }
                    : undefined,
            message: activity.description ?? this.getActivityMessage(activity),
            metadata: activity.metadata,
            timestamp: activity.createdAt.toISOString()
        };

        await this.eventBus.publish({
            eventId: `activity_${Date.now()}`,
            eventType: CollaborationEvents.ACTIVITY_NEW,
            timestamp: new Date(),
            aggregateType: 'Activity',
            aggregateId: activity.id,
            payload: payload as unknown as Record<string, unknown>
        });
    }

    private async processMentions(
        tenantId: string,
        actorId: string,
        mentionedUserIds: string[],
        targetType?: string,
        targetId?: string,
        targetName?: string
    ): Promise<void> {
        for (const mentionedUserId of mentionedUserIds) {
            const payload: IMentionPayload = {
                tenantId,
                mentionedUserId,
                mentionedBy: {
                    userId: actorId,
                    name: 'User' // Would need to fetch actor name
                },
                context: {
                    type: 'activity',
                    documentType: targetType,
                    documentId: targetId,
                    documentName: targetName
                },
                message: `You were mentioned in ${targetName ?? 'a document'}`,
                timestamp: new Date().toISOString()
            };

            await this.eventBus.publish({
                eventId: `mention_${Date.now()}_${mentionedUserId}`,
                eventType: CollaborationEvents.MENTION,
                timestamp: new Date(),
                aggregateType: 'Mention',
                aggregateId: mentionedUserId,
                payload: payload as unknown as Record<string, unknown>
            });
        }
    }

    private getActivityMessage(activity: IActivityDto): string {
        const messages: Record<string, string> = {
            order_created: 'created a new order',
            order_updated: 'updated an order',
            order_cancelled: 'cancelled an order',
            cutting_job_created: 'created a cutting job',
            cutting_job_assigned: 'assigned a cutting job',
            optimization_started: 'started an optimization',
            optimization_completed: 'completed an optimization',
            plan_approved: 'approved a cutting plan',
            plan_rejected: 'rejected a cutting plan',
            production_started: 'started production',
            production_completed: 'completed production',
            stock_alert: 'received a stock alert',
            comment_added: 'added a comment',
            mention: 'mentioned someone'
        };

        return messages[activity.activityType] ?? 'performed an action';
    }
}

// ==================== ACTIVITY FACTORY HELPERS ====================

/**
 * Create activity input for common actions
 */
export const ActivityFactory = {
    orderCreated(tenantId: string, actorId: string, orderId: string, orderNumber: string): IActivityInput {
        return {
            tenantId,
            actorId,
            activityType: 'order_created',
            targetType: 'order',
            targetId: orderId,
            metadata: {
                targetName: orderNumber,
                description: `Order ${orderNumber} created`
            }
        };
    },

    optimizationCompleted(
        tenantId: string,
        actorId: string,
        scenarioId: string,
        scenarioName: string,
        wastePercentage: number
    ): IActivityInput {
        return {
            tenantId,
            actorId,
            activityType: 'optimization_completed',
            targetType: 'optimization_scenario',
            targetId: scenarioId,
            metadata: {
                targetName: scenarioName,
                description: `Optimization completed with ${wastePercentage.toFixed(1)}% waste`,
                wastePercentage
            }
        };
    },

    planApproved(tenantId: string, actorId: string, planId: string, planNumber: string): IActivityInput {
        return {
            tenantId,
            actorId,
            activityType: 'plan_approved',
            targetType: 'cutting_plan',
            targetId: planId,
            metadata: {
                targetName: planNumber,
                description: `Plan ${planNumber} approved for production`
            }
        };
    },

    stockAlert(tenantId: string, stockItemId: string, stockCode: string, alertLevel: string): IActivityInput {
        return {
            tenantId,
            actorId: 'system',
            activityType: 'stock_alert',
            targetType: 'stock_item',
            targetId: stockItemId,
            metadata: {
                targetName: stockCode,
                description: `Stock ${stockCode} is ${alertLevel.toLowerCase()}`,
                alertLevel
            }
        };
    }
};
