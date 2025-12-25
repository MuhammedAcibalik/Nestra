/**
 * Drizzle ORM - Optimization Tables
 * OptimizationScenario, CuttingPlan, CuttingPlanStock
 */

import { pgTable, uuid, text, real, integer, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { scenarioStatusEnum, planStatusEnum } from './enums';
import { users } from './auth';
import { cuttingJobs } from './cutting-job';
import { machines } from './machine';
import { stockItems } from './stock';
import { tenants } from './tenant';

// ==================== OPTIMIZATION SCENARIO ====================

export const optimizationScenarios = pgTable('optimization_scenarios', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),  // Nullable for backward compatibility
    name: text('name').notNull(),
    cuttingJobId: uuid('cutting_job_id').notNull().references(() => cuttingJobs.id),
    createdById: uuid('created_by_id').notNull().references(() => users.id),
    parameters: jsonb('parameters').notNull(),
    useWarehouseStock: boolean('use_warehouse_stock').default(true).notNull(),
    useStandardSizes: boolean('use_standard_sizes').default(true).notNull(),
    selectedStockIds: jsonb('selected_stock_ids'),
    status: scenarioStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const optimizationScenariosRelations = relations(optimizationScenarios, ({ one, many }) => ({
    cuttingJob: one(cuttingJobs, {
        fields: [optimizationScenarios.cuttingJobId],
        references: [cuttingJobs.id],
    }),
    createdBy: one(users, {
        fields: [optimizationScenarios.createdById],
        references: [users.id],
    }),
    results: many(cuttingPlans),
}));

// ==================== CUTTING PLAN ====================

export const cuttingPlans = pgTable('cutting_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    planNumber: text('plan_number').unique().notNull(),
    scenarioId: uuid('scenario_id').notNull().references(() => optimizationScenarios.id),
    totalWaste: real('total_waste').notNull(),
    wastePercentage: real('waste_percentage').notNull(),
    stockUsedCount: integer('stock_used_count').notNull(),
    estimatedTime: real('estimated_time'),
    estimatedCost: real('estimated_cost'),
    status: planStatusEnum('status').default('DRAFT').notNull(),
    approvedById: uuid('approved_by_id').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    machineId: uuid('machine_id').references(() => machines.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cuttingPlansRelations = relations(cuttingPlans, ({ one, many }) => ({
    scenario: one(optimizationScenarios, {
        fields: [cuttingPlans.scenarioId],
        references: [optimizationScenarios.id],
    }),
    approvedBy: one(users, {
        fields: [cuttingPlans.approvedById],
        references: [users.id],
    }),
    machine: one(machines, {
        fields: [cuttingPlans.machineId],
        references: [machines.id],
    }),
    stockItems: many(cuttingPlanStocks),
}));

// ==================== CUTTING PLAN STOCK ====================

export const cuttingPlanStocks = pgTable('cutting_plan_stocks', {
    id: uuid('id').primaryKey().defaultRandom(),
    cuttingPlanId: uuid('cutting_plan_id').notNull().references(() => cuttingPlans.id, { onDelete: 'cascade' }),
    stockItemId: uuid('stock_item_id').notNull().references(() => stockItems.id),
    sequence: integer('sequence').notNull(),
    waste: real('waste').notNull(),
    wastePercentage: real('waste_percentage').notNull(),
    layoutData: jsonb('layout_data').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('cutting_plan_stock_seq').on(table.cuttingPlanId, table.sequence)
]);

export const cuttingPlanStocksRelations = relations(cuttingPlanStocks, ({ one }) => ({
    cuttingPlan: one(cuttingPlans, {
        fields: [cuttingPlanStocks.cuttingPlanId],
        references: [cuttingPlans.id],
    }),
    stockItem: one(stockItems, {
        fields: [cuttingPlanStocks.stockItemId],
        references: [stockItems.id],
    }),
}));
