"use strict";
/**
 * Activity Feed Service
 * Real-time activity tracking and notifications
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityFactory = exports.ActivityFeedService = void 0;
const event_bus_1 = require("../../core/events/event-bus");
const logger_1 = require("../../core/logger");
const collaboration_events_1 = require("./collaboration.events");
const logger = (0, logger_1.createModuleLogger)('ActivityFeedService');
// ==================== SERVICE ====================
class ActivityFeedService {
    repository;
    eventBus;
    constructor(repository) {
        this.repository = repository;
        this.eventBus = event_bus_1.EventBus.getInstance();
    }
    // ==================== RECORD ACTIVITY ====================
    async recordActivity(input) {
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
                await this.processMentions(input.tenantId, input.actorId, input.metadata.mentionedUserIds, input.targetType, input.targetId, input.metadata.targetName);
            }
            logger.debug('Activity recorded', {
                id: activity.id,
                type: activity.activityType,
                actor: activity.actorId
            });
            return dto;
        }
        catch (error) {
            logger.error('Failed to record activity', { error, input });
            throw error;
        }
    }
    // ==================== QUERY ACTIVITIES ====================
    async getActivities(tenantId, options) {
        const activities = await this.repository.getActivities(tenantId, options ?? {});
        return activities.map((a) => this.toActivityDto(a));
    }
    async getActivityById(activityId) {
        const activity = await this.repository.getActivityById(activityId);
        return activity ? this.toActivityDto(activity) : null;
    }
    async getDocumentActivities(tenantId, documentType, documentId, limit = 20) {
        const activities = await this.repository.getActivities(tenantId, {
            targetType: documentType,
            targetId: documentId,
            limit
        });
        return activities.map((a) => this.toActivityDto(a));
    }
    // ==================== UNREAD MANAGEMENT ====================
    async getUnreadCount(tenantId, userId) {
        return this.repository.getUnreadCount(tenantId, userId);
    }
    async markAsRead(userId, activityIds) {
        for (const activityId of activityIds) {
            await this.repository.markAsRead(activityId, userId);
        }
    }
    async markAllAsRead(tenantId, userId) {
        await this.repository.markAllAsRead(tenantId, userId);
    }
    // ==================== MENTIONS ====================
    async getMentions(tenantId, userId, limit = 20) {
        // Get activities where this user was mentioned
        const activities = await this.repository.getActivities(tenantId, {
            userId,
            limit
        });
        // Filter to only those with mentions (would need schema support)
        return activities.map((a) => this.toActivityDto(a));
    }
    // ==================== HELPERS ====================
    toActivityDto(activity) {
        const metadata = activity.metadata;
        const actorInfo = activity;
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
    async broadcastActivity(activity) {
        const payload = {
            tenantId: activity.tenantId,
            activityId: activity.id,
            activityType: activity.activityType,
            actor: {
                userId: activity.actorId,
                name: activity.actorName ?? 'Unknown'
            },
            target: activity.targetType && activity.targetId
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
            eventType: collaboration_events_1.CollaborationEvents.ACTIVITY_NEW,
            timestamp: new Date(),
            aggregateType: 'Activity',
            aggregateId: activity.id,
            payload: payload
        });
    }
    async processMentions(tenantId, actorId, mentionedUserIds, targetType, targetId, targetName) {
        for (const mentionedUserId of mentionedUserIds) {
            const payload = {
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
                eventType: collaboration_events_1.CollaborationEvents.MENTION,
                timestamp: new Date(),
                aggregateType: 'Mention',
                aggregateId: mentionedUserId,
                payload: payload
            });
        }
    }
    getActivityMessage(activity) {
        const messages = {
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
exports.ActivityFeedService = ActivityFeedService;
// ==================== ACTIVITY FACTORY HELPERS ====================
/**
 * Create activity input for common actions
 */
exports.ActivityFactory = {
    orderCreated(tenantId, actorId, orderId, orderNumber) {
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
    optimizationCompleted(tenantId, actorId, scenarioId, scenarioName, wastePercentage) {
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
    planApproved(tenantId, actorId, planId, planNumber) {
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
    stockAlert(tenantId, stockItemId, stockCode, alertLevel) {
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
//# sourceMappingURL=activity-feed.service.js.map