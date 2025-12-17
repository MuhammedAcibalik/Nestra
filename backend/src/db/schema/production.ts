/**
 * Drizzle ORM - Production Tables
 * ProductionLog, DowntimeLog, QualityCheck
 */

import { pgTable, uuid, real, timestamp, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { productionStatusEnum, downtimeReasonEnum, qcResultEnum } from './enums';
import { cuttingPlans } from './optimization';
import { users } from './auth';
import { stockMovements } from './stock';
import { machines } from './machine';

// ==================== PRODUCTION LOG ====================

export const productionLogs = pgTable('production_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    cuttingPlanId: uuid('cutting_plan_id').notNull().references(() => cuttingPlans.id),
    operatorId: uuid('operator_id').notNull().references(() => users.id),
    actualWaste: real('actual_waste'),
    actualTime: real('actual_time'),
    status: productionStatusEnum('status').default('STARTED').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    notes: text('notes'),
    issues: jsonb('issues'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productionLogsRelations = relations(productionLogs, ({ one, many }) => ({
    cuttingPlan: one(cuttingPlans, {
        fields: [productionLogs.cuttingPlanId],
        references: [cuttingPlans.id],
    }),
    operator: one(users, {
        fields: [productionLogs.operatorId],
        references: [users.id],
    }),
    stockMovements: many(stockMovements),
    downtimeLogs: many(downtimeLogs),
    qualityChecks: many(qualityChecks),
}));

// ==================== DOWNTIME LOG ====================

export const downtimeLogs = pgTable('downtime_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    productionLogId: uuid('production_log_id').notNull().references(() => productionLogs.id),
    machineId: uuid('machine_id').references(() => machines.id),
    reason: downtimeReasonEnum('reason').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    durationMinutes: real('duration_minutes'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const downtimeLogsRelations = relations(downtimeLogs, ({ one }) => ({
    productionLog: one(productionLogs, {
        fields: [downtimeLogs.productionLogId],
        references: [productionLogs.id],
    }),
    machine: one(machines, {
        fields: [downtimeLogs.machineId],
        references: [machines.id],
    }),
}));

// ==================== QUALITY CHECK ====================

export const qualityChecks = pgTable('quality_checks', {
    id: uuid('id').primaryKey().defaultRandom(),
    productionLogId: uuid('production_log_id').notNull().references(() => productionLogs.id),
    result: qcResultEnum('result').notNull(),
    passedCount: integer('passed_count').default(0).notNull(),
    failedCount: integer('failed_count').default(0).notNull(),
    defectTypes: jsonb('defect_types'), // Array of defect descriptions
    inspectorId: uuid('inspector_id').references(() => users.id),
    checkedAt: timestamp('checked_at').defaultNow().notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const qualityChecksRelations = relations(qualityChecks, ({ one }) => ({
    productionLog: one(productionLogs, {
        fields: [qualityChecks.productionLogId],
        references: [productionLogs.id],
    }),
    inspector: one(users, {
        fields: [qualityChecks.inspectorId],
        references: [users.id],
    }),
}));

