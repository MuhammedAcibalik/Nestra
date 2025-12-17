/**
 * Drizzle ORM - Enum Definitions
 * Converted from Prisma schema
 */
export declare const stockTypeEnum: import("drizzle-orm/pg-core").PgEnum<["BAR_1D", "SHEET_2D"]>;
export declare const machineTypeEnum: import("drizzle-orm/pg-core").PgEnum<["CNC_1D", "CNC_2D", "GUILLOTINE", "LASER", "PLASMA", "WATERJET", "SAW", "OTHER"]>;
export declare const orderStatusEnum: import("drizzle-orm/pg-core").PgEnum<["DRAFT", "CONFIRMED", "IN_PLANNING", "IN_PRODUCTION", "COMPLETED", "CANCELLED"]>;
export declare const geometryTypeEnum: import("drizzle-orm/pg-core").PgEnum<["BAR_1D", "RECTANGLE", "CIRCLE", "SQUARE", "POLYGON", "FREEFORM"]>;
export declare const cuttingJobStatusEnum: import("drizzle-orm/pg-core").PgEnum<["PENDING", "OPTIMIZING", "OPTIMIZED", "IN_PRODUCTION", "COMPLETED"]>;
export declare const scenarioStatusEnum: import("drizzle-orm/pg-core").PgEnum<["PENDING", "RUNNING", "COMPLETED", "FAILED"]>;
export declare const planStatusEnum: import("drizzle-orm/pg-core").PgEnum<["DRAFT", "APPROVED", "IN_PRODUCTION", "COMPLETED", "CANCELLED"]>;
export declare const productionStatusEnum: import("drizzle-orm/pg-core").PgEnum<["STARTED", "PAUSED", "COMPLETED", "CANCELLED"]>;
export declare const movementTypeEnum: import("drizzle-orm/pg-core").PgEnum<["PURCHASE", "CONSUMPTION", "WASTE_REUSE", "SCRAP", "ADJUSTMENT", "TRANSFER"]>;
export declare const downtimeReasonEnum: import("drizzle-orm/pg-core").PgEnum<["BREAKDOWN", "MAINTENANCE", "MATERIAL_WAIT", "TOOL_CHANGE", "OPERATOR_BREAK", "SETUP", "OTHER"]>;
export declare const qcResultEnum: import("drizzle-orm/pg-core").PgEnum<["PASS", "FAIL", "PARTIAL"]>;
export type StockType = (typeof stockTypeEnum.enumValues)[number];
export type MachineType = (typeof machineTypeEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type GeometryType = (typeof geometryTypeEnum.enumValues)[number];
export type CuttingJobStatus = (typeof cuttingJobStatusEnum.enumValues)[number];
export type ScenarioStatus = (typeof scenarioStatusEnum.enumValues)[number];
export type PlanStatus = (typeof planStatusEnum.enumValues)[number];
export type ProductionStatus = (typeof productionStatusEnum.enumValues)[number];
export type MovementType = (typeof movementTypeEnum.enumValues)[number];
export type DowntimeReason = (typeof downtimeReasonEnum.enumValues)[number];
export type QcResult = (typeof qcResultEnum.enumValues)[number];
//# sourceMappingURL=enums.d.ts.map