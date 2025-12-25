/**
 * Drizzle ORM - Activities Table
 * Activity feed for real-time collaboration
 */

import { pgTable, uuid, text, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenant';
import { users } from './auth';

// ==================== ACTIVITY TYPES ====================

export type ActivityType =
    | 'order_created' | 'order_updated' | 'order_cancelled' | 'order_completed'
    | 'cutting_job_created' | 'cutting_job_assigned' | 'cutting_job_started'
    | 'optimization_started' | 'optimization_completed' | 'optimization_failed'
    | 'plan_approved' | 'plan_rejected' | 'plan_exported'
    | 'production_started' | 'production_paused' | 'production_completed'
    | 'stock_alert' | 'stock_replenished'
    | 'machine_alert' | 'machine_maintenance'
    | 'comment_added' | 'mention'
    | 'user_joined' | 'user_invited';

export interface IActivityMetadata {
    readonly targetName?: string;
    readonly previousValue?: unknown;
    readonly newValue?: unknown;
    readonly description?: string;
    readonly mentionedUserIds?: string[];
    readonly [key: string]: unknown;
}

// ==================== ACTIVITIES ====================

export const activities = pgTable('activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').notNull().references(() => users.id),
    activityType: text('activity_type').$type<ActivityType>().notNull(),
    targetType: text('target_type'),  // 'order', 'cutting_plan', 'cutting_job', etc.
    targetId: uuid('target_id'),
    metadata: jsonb('metadata').$type<IActivityMetadata>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [activities.tenantId],
        references: [tenants.id],
    }),
    actor: one(users, {
        fields: [activities.actorId],
        references: [users.id],
    }),
    readStatuses: many(activityReadStatus),
}));

// ==================== ACTIVITY READ STATUS ====================
// Tracks which users have read which activities

export const activityReadStatus = pgTable('activity_read_status', {
    activityId: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at').defaultNow().notNull(),
}, (table) => [
    primaryKey({ columns: [table.activityId, table.userId] })
]);

export const activityReadStatusRelations = relations(activityReadStatus, ({ one }) => ({
    activity: one(activities, {
        fields: [activityReadStatus.activityId],
        references: [activities.id],
    }),
    user: one(users, {
        fields: [activityReadStatus.userId],
        references: [users.id],
    }),
}));

// ==================== TYPE EXPORTS ====================

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ActivityReadStatusRecord = typeof activityReadStatus.$inferSelect;
