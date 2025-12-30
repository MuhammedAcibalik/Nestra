"use strict";
/**
 * Drizzle ORM - Activities Table
 * Activity feed for real-time collaboration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityReadStatusRelations = exports.activityReadStatus = exports.activitiesRelations = exports.activities = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const tenant_1 = require("./tenant");
const auth_1 = require("./auth");
// ==================== ACTIVITIES ====================
exports.activities = (0, pg_core_1.pgTable)('activities', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id')
        .notNull()
        .references(() => tenant_1.tenants.id, { onDelete: 'cascade' }),
    actorId: (0, pg_core_1.uuid)('actor_id')
        .notNull()
        .references(() => auth_1.users.id),
    activityType: (0, pg_core_1.text)('activity_type').$type().notNull(),
    targetType: (0, pg_core_1.text)('target_type'), // 'order', 'cutting_plan', 'cutting_job', etc.
    targetId: (0, pg_core_1.uuid)('target_id'),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
exports.activitiesRelations = (0, drizzle_orm_1.relations)(exports.activities, ({ one, many }) => ({
    tenant: one(tenant_1.tenants, {
        fields: [exports.activities.tenantId],
        references: [tenant_1.tenants.id]
    }),
    actor: one(auth_1.users, {
        fields: [exports.activities.actorId],
        references: [auth_1.users.id]
    }),
    readStatuses: many(exports.activityReadStatus)
}));
// ==================== ACTIVITY READ STATUS ====================
// Tracks which users have read which activities
exports.activityReadStatus = (0, pg_core_1.pgTable)('activity_read_status', {
    activityId: (0, pg_core_1.uuid)('activity_id')
        .notNull()
        .references(() => exports.activities.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => auth_1.users.id, { onDelete: 'cascade' }),
    readAt: (0, pg_core_1.timestamp)('read_at').defaultNow().notNull()
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.activityId, table.userId] })]);
exports.activityReadStatusRelations = (0, drizzle_orm_1.relations)(exports.activityReadStatus, ({ one }) => ({
    activity: one(exports.activities, {
        fields: [exports.activityReadStatus.activityId],
        references: [exports.activities.id]
    }),
    user: one(auth_1.users, {
        fields: [exports.activityReadStatus.userId],
        references: [auth_1.users.id]
    })
}));
//# sourceMappingURL=activities.js.map