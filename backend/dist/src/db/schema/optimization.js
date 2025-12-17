"use strict";
/**
 * Drizzle ORM - Optimization Tables
 * OptimizationScenario, CuttingPlan, CuttingPlanStock
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuttingPlanStocksRelations = exports.cuttingPlanStocks = exports.cuttingPlansRelations = exports.cuttingPlans = exports.optimizationScenariosRelations = exports.optimizationScenarios = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
const auth_1 = require("./auth");
const cutting_job_1 = require("./cutting-job");
const machine_1 = require("./machine");
const stock_1 = require("./stock");
// ==================== OPTIMIZATION SCENARIO ====================
exports.optimizationScenarios = (0, pg_core_1.pgTable)('optimization_scenarios', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    cuttingJobId: (0, pg_core_1.uuid)('cutting_job_id').notNull().references(() => cutting_job_1.cuttingJobs.id),
    createdById: (0, pg_core_1.uuid)('created_by_id').notNull().references(() => auth_1.users.id),
    parameters: (0, pg_core_1.jsonb)('parameters').notNull(),
    useWarehouseStock: (0, pg_core_1.boolean)('use_warehouse_stock').default(true).notNull(),
    useStandardSizes: (0, pg_core_1.boolean)('use_standard_sizes').default(true).notNull(),
    selectedStockIds: (0, pg_core_1.jsonb)('selected_stock_ids'),
    status: (0, enums_1.scenarioStatusEnum)('status').default('PENDING').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.optimizationScenariosRelations = (0, drizzle_orm_1.relations)(exports.optimizationScenarios, ({ one, many }) => ({
    cuttingJob: one(cutting_job_1.cuttingJobs, {
        fields: [exports.optimizationScenarios.cuttingJobId],
        references: [cutting_job_1.cuttingJobs.id],
    }),
    createdBy: one(auth_1.users, {
        fields: [exports.optimizationScenarios.createdById],
        references: [auth_1.users.id],
    }),
    results: many(exports.cuttingPlans),
}));
// ==================== CUTTING PLAN ====================
exports.cuttingPlans = (0, pg_core_1.pgTable)('cutting_plans', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    planNumber: (0, pg_core_1.text)('plan_number').unique().notNull(),
    scenarioId: (0, pg_core_1.uuid)('scenario_id').notNull().references(() => exports.optimizationScenarios.id),
    totalWaste: (0, pg_core_1.real)('total_waste').notNull(),
    wastePercentage: (0, pg_core_1.real)('waste_percentage').notNull(),
    stockUsedCount: (0, pg_core_1.integer)('stock_used_count').notNull(),
    estimatedTime: (0, pg_core_1.real)('estimated_time'),
    estimatedCost: (0, pg_core_1.real)('estimated_cost'),
    status: (0, enums_1.planStatusEnum)('status').default('DRAFT').notNull(),
    approvedById: (0, pg_core_1.uuid)('approved_by_id').references(() => auth_1.users.id),
    approvedAt: (0, pg_core_1.timestamp)('approved_at'),
    machineId: (0, pg_core_1.uuid)('machine_id').references(() => machine_1.machines.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.cuttingPlansRelations = (0, drizzle_orm_1.relations)(exports.cuttingPlans, ({ one, many }) => ({
    scenario: one(exports.optimizationScenarios, {
        fields: [exports.cuttingPlans.scenarioId],
        references: [exports.optimizationScenarios.id],
    }),
    approvedBy: one(auth_1.users, {
        fields: [exports.cuttingPlans.approvedById],
        references: [auth_1.users.id],
    }),
    machine: one(machine_1.machines, {
        fields: [exports.cuttingPlans.machineId],
        references: [machine_1.machines.id],
    }),
    stockItems: many(exports.cuttingPlanStocks),
}));
// ==================== CUTTING PLAN STOCK ====================
exports.cuttingPlanStocks = (0, pg_core_1.pgTable)('cutting_plan_stocks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    cuttingPlanId: (0, pg_core_1.uuid)('cutting_plan_id').notNull().references(() => exports.cuttingPlans.id, { onDelete: 'cascade' }),
    stockItemId: (0, pg_core_1.uuid)('stock_item_id').notNull().references(() => stock_1.stockItems.id),
    sequence: (0, pg_core_1.integer)('sequence').notNull(),
    waste: (0, pg_core_1.real)('waste').notNull(),
    wastePercentage: (0, pg_core_1.real)('waste_percentage').notNull(),
    layoutData: (0, pg_core_1.jsonb)('layout_data').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)('cutting_plan_stock_seq').on(table.cuttingPlanId, table.sequence)
]);
exports.cuttingPlanStocksRelations = (0, drizzle_orm_1.relations)(exports.cuttingPlanStocks, ({ one }) => ({
    cuttingPlan: one(exports.cuttingPlans, {
        fields: [exports.cuttingPlanStocks.cuttingPlanId],
        references: [exports.cuttingPlans.id],
    }),
    stockItem: one(stock_1.stockItems, {
        fields: [exports.cuttingPlanStocks.stockItemId],
        references: [stock_1.stockItems.id],
    }),
}));
//# sourceMappingURL=optimization.js.map