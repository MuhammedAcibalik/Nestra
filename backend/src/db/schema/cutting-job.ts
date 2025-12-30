/**
 * Drizzle ORM - Cutting Job Tables
 * CuttingJob, CuttingJobItem
 */

import { pgTable, uuid, real, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cuttingJobStatusEnum } from './enums';
import { orderItems } from './order';
import { tenants } from './tenant';

// ==================== CUTTING JOB ====================

export const cuttingJobs = pgTable('cutting_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id), // Nullable for backward compatibility
    jobNumber: uuid('job_number').unique().notNull(),
    materialTypeId: uuid('material_type_id').notNull(),
    thickness: real('thickness').notNull(),
    status: cuttingJobStatusEnum('status').default('PENDING').notNull(),
    // Optimistic Locking
    version: integer('version').default(1).notNull(),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    // Soft Delete
    deletedAt: timestamp('deleted_at')
});

export const cuttingJobsRelations = relations(cuttingJobs, ({ many }) => ({
    items: many(cuttingJobItems)
}));

// ==================== CUTTING JOB ITEM ====================

export const cuttingJobItems = pgTable(
    'cutting_job_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        cuttingJobId: uuid('cutting_job_id')
            .notNull()
            .references(() => cuttingJobs.id, { onDelete: 'cascade' }),
        orderItemId: uuid('order_item_id')
            .notNull()
            .references(() => orderItems.id),
        quantity: integer('quantity').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull()
    },
    (table) => [unique('cutting_job_item_unique').on(table.cuttingJobId, table.orderItemId)]
);

export const cuttingJobItemsRelations = relations(cuttingJobItems, ({ one }) => ({
    cuttingJob: one(cuttingJobs, {
        fields: [cuttingJobItems.cuttingJobId],
        references: [cuttingJobs.id]
    }),
    orderItem: one(orderItems, {
        fields: [cuttingJobItems.orderItemId],
        references: [orderItems.id]
    })
}));
