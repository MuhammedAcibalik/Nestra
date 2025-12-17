"use strict";
/**
 * Drizzle ORM - Enum Definitions
 * Converted from Prisma schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qcResultEnum = exports.downtimeReasonEnum = exports.movementTypeEnum = exports.productionStatusEnum = exports.planStatusEnum = exports.scenarioStatusEnum = exports.cuttingJobStatusEnum = exports.geometryTypeEnum = exports.orderStatusEnum = exports.machineTypeEnum = exports.stockTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Stock & Material
exports.stockTypeEnum = (0, pg_core_1.pgEnum)('stock_type', ['BAR_1D', 'SHEET_2D']);
// Machine
exports.machineTypeEnum = (0, pg_core_1.pgEnum)('machine_type', [
    'CNC_1D', 'CNC_2D', 'GUILLOTINE', 'LASER', 'PLASMA', 'WATERJET', 'SAW', 'OTHER'
]);
// Order
exports.orderStatusEnum = (0, pg_core_1.pgEnum)('order_status', [
    'DRAFT', 'CONFIRMED', 'IN_PLANNING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'
]);
exports.geometryTypeEnum = (0, pg_core_1.pgEnum)('geometry_type', [
    'BAR_1D', 'RECTANGLE', 'CIRCLE', 'SQUARE', 'POLYGON', 'FREEFORM'
]);
// Cutting Job
exports.cuttingJobStatusEnum = (0, pg_core_1.pgEnum)('cutting_job_status', [
    'PENDING', 'OPTIMIZING', 'OPTIMIZED', 'IN_PRODUCTION', 'COMPLETED'
]);
// Optimization
exports.scenarioStatusEnum = (0, pg_core_1.pgEnum)('scenario_status', [
    'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
]);
exports.planStatusEnum = (0, pg_core_1.pgEnum)('plan_status', [
    'DRAFT', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'
]);
// Production
exports.productionStatusEnum = (0, pg_core_1.pgEnum)('production_status', [
    'STARTED', 'PAUSED', 'COMPLETED', 'CANCELLED'
]);
exports.movementTypeEnum = (0, pg_core_1.pgEnum)('movement_type', [
    'PURCHASE', 'CONSUMPTION', 'WASTE_REUSE', 'SCRAP', 'ADJUSTMENT', 'TRANSFER'
]);
// Downtime - Duruş sebep kodları
exports.downtimeReasonEnum = (0, pg_core_1.pgEnum)('downtime_reason', [
    'BREAKDOWN', // Arıza
    'MAINTENANCE', // Bakım
    'MATERIAL_WAIT', // Malzeme bekleme
    'TOOL_CHANGE', // Takım değişimi
    'OPERATOR_BREAK', // Operatör molası
    'SETUP', // Kurulum
    'OTHER' // Diğer
]);
// Quality Control - Kalite kontrol sonuçları
exports.qcResultEnum = (0, pg_core_1.pgEnum)('qc_result', [
    'PASS', // Geçti
    'FAIL', // Başarısız
    'PARTIAL' // Kısmi geçti
]);
//# sourceMappingURL=enums.js.map