"use strict";
/**
 * Drizzle ORM - Cutting Job Tables
 * CuttingJob, CuttingJobItem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuttingJobItemsRelations = exports.cuttingJobItems = exports.cuttingJobsRelations = exports.cuttingJobs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
const order_1 = require("./order");
const tenant_1 = require("./tenant");
// ==================== CUTTING JOB ====================
exports.cuttingJobs = (0, pg_core_1.pgTable)('cutting_jobs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => tenant_1.tenants.id), // Nullable for backward compatibility
    jobNumber: (0, pg_core_1.uuid)('job_number').unique().notNull(),
    materialTypeId: (0, pg_core_1.uuid)('material_type_id').notNull(),
    thickness: (0, pg_core_1.real)('thickness').notNull(),
    status: (0, enums_1.cuttingJobStatusEnum)('status').default('PENDING').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.cuttingJobsRelations = (0, drizzle_orm_1.relations)(exports.cuttingJobs, ({ many }) => ({
    items: many(exports.cuttingJobItems),
}));
// ==================== CUTTING JOB ITEM ====================
exports.cuttingJobItems = (0, pg_core_1.pgTable)('cutting_job_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    cuttingJobId: (0, pg_core_1.uuid)('cutting_job_id').notNull().references(() => exports.cuttingJobs.id, { onDelete: 'cascade' }),
    orderItemId: (0, pg_core_1.uuid)('order_item_id').notNull().references(() => order_1.orderItems.id),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)('cutting_job_item_unique').on(table.cuttingJobId, table.orderItemId)
]);
exports.cuttingJobItemsRelations = (0, drizzle_orm_1.relations)(exports.cuttingJobItems, ({ one }) => ({
    cuttingJob: one(exports.cuttingJobs, {
        fields: [exports.cuttingJobItems.cuttingJobId],
        references: [exports.cuttingJobs.id],
    }),
    orderItem: one(order_1.orderItems, {
        fields: [exports.cuttingJobItems.orderItemId],
        references: [order_1.orderItems.id],
    }),
}));
//# sourceMappingURL=cutting-job.js.map