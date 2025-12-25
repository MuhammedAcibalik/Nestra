"use strict";
/**
 * Drizzle ORM - Production Tables
 * ProductionLog, DowntimeLog, QualityCheck
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qualityChecksRelations = exports.qualityChecks = exports.downtimeLogsRelations = exports.downtimeLogs = exports.productionLogsRelations = exports.productionLogs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
const optimization_1 = require("./optimization");
const auth_1 = require("./auth");
const stock_1 = require("./stock");
const machine_1 = require("./machine");
const tenant_1 = require("./tenant");
// ==================== PRODUCTION LOG ====================
exports.productionLogs = (0, pg_core_1.pgTable)('production_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => tenant_1.tenants.id), // Nullable for backward compatibility
    cuttingPlanId: (0, pg_core_1.uuid)('cutting_plan_id').notNull().references(() => optimization_1.cuttingPlans.id),
    operatorId: (0, pg_core_1.uuid)('operator_id').notNull().references(() => auth_1.users.id),
    actualWaste: (0, pg_core_1.real)('actual_waste'),
    actualTime: (0, pg_core_1.real)('actual_time'),
    status: (0, enums_1.productionStatusEnum)('status').default('STARTED').notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    notes: (0, pg_core_1.text)('notes'),
    issues: (0, pg_core_1.jsonb)('issues'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.productionLogsRelations = (0, drizzle_orm_1.relations)(exports.productionLogs, ({ one, many }) => ({
    cuttingPlan: one(optimization_1.cuttingPlans, {
        fields: [exports.productionLogs.cuttingPlanId],
        references: [optimization_1.cuttingPlans.id],
    }),
    operator: one(auth_1.users, {
        fields: [exports.productionLogs.operatorId],
        references: [auth_1.users.id],
    }),
    stockMovements: many(stock_1.stockMovements),
    downtimeLogs: many(exports.downtimeLogs),
    qualityChecks: many(exports.qualityChecks),
}));
// ==================== DOWNTIME LOG ====================
exports.downtimeLogs = (0, pg_core_1.pgTable)('downtime_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    productionLogId: (0, pg_core_1.uuid)('production_log_id').notNull().references(() => exports.productionLogs.id),
    machineId: (0, pg_core_1.uuid)('machine_id').references(() => machine_1.machines.id),
    reason: (0, enums_1.downtimeReasonEnum)('reason').notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    endedAt: (0, pg_core_1.timestamp)('ended_at'),
    durationMinutes: (0, pg_core_1.real)('duration_minutes'),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.downtimeLogsRelations = (0, drizzle_orm_1.relations)(exports.downtimeLogs, ({ one }) => ({
    productionLog: one(exports.productionLogs, {
        fields: [exports.downtimeLogs.productionLogId],
        references: [exports.productionLogs.id],
    }),
    machine: one(machine_1.machines, {
        fields: [exports.downtimeLogs.machineId],
        references: [machine_1.machines.id],
    }),
}));
// ==================== QUALITY CHECK ====================
exports.qualityChecks = (0, pg_core_1.pgTable)('quality_checks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    productionLogId: (0, pg_core_1.uuid)('production_log_id').notNull().references(() => exports.productionLogs.id),
    result: (0, enums_1.qcResultEnum)('result').notNull(),
    passedCount: (0, pg_core_1.integer)('passed_count').default(0).notNull(),
    failedCount: (0, pg_core_1.integer)('failed_count').default(0).notNull(),
    defectTypes: (0, pg_core_1.jsonb)('defect_types'), // Array of defect descriptions
    inspectorId: (0, pg_core_1.uuid)('inspector_id').references(() => auth_1.users.id),
    checkedAt: (0, pg_core_1.timestamp)('checked_at').defaultNow().notNull(),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.qualityChecksRelations = (0, drizzle_orm_1.relations)(exports.qualityChecks, ({ one }) => ({
    productionLog: one(exports.productionLogs, {
        fields: [exports.qualityChecks.productionLogId],
        references: [exports.productionLogs.id],
    }),
    inspector: one(auth_1.users, {
        fields: [exports.qualityChecks.inspectorId],
        references: [auth_1.users.id],
    }),
}));
//# sourceMappingURL=production.js.map