/**
 * Drizzle ORM - Enum Definitions
 * Converted from Prisma schema
 */

import { pgEnum } from 'drizzle-orm/pg-core';

// Stock & Material
export const stockTypeEnum = pgEnum('stock_type', ['BAR_1D', 'SHEET_2D']);

// Machine
export const machineTypeEnum = pgEnum('machine_type', [
    'CNC_1D',
    'CNC_2D',
    'GUILLOTINE',
    'LASER',
    'PLASMA',
    'WATERJET',
    'SAW',
    'OTHER'
]);

// Order
export const orderStatusEnum = pgEnum('order_status', [
    'DRAFT',
    'CONFIRMED',
    'IN_PLANNING',
    'IN_PRODUCTION',
    'COMPLETED',
    'CANCELLED'
]);

export const geometryTypeEnum = pgEnum('geometry_type', [
    'BAR_1D',
    'RECTANGLE',
    'CIRCLE',
    'SQUARE',
    'POLYGON',
    'FREEFORM'
]);

// Cutting Job
export const cuttingJobStatusEnum = pgEnum('cutting_job_status', [
    'PENDING',
    'OPTIMIZING',
    'OPTIMIZED',
    'IN_PRODUCTION',
    'COMPLETED'
]);

// Optimization
export const scenarioStatusEnum = pgEnum('scenario_status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);

export const planStatusEnum = pgEnum('plan_status', ['DRAFT', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED']);

// Production
export const productionStatusEnum = pgEnum('production_status', ['STARTED', 'PAUSED', 'COMPLETED', 'CANCELLED']);

export const movementTypeEnum = pgEnum('movement_type', [
    'PURCHASE',
    'CONSUMPTION',
    'WASTE_REUSE',
    'SCRAP',
    'ADJUSTMENT',
    'TRANSFER'
]);

// Downtime - Duruş sebep kodları
export const downtimeReasonEnum = pgEnum('downtime_reason', [
    'BREAKDOWN', // Arıza
    'MAINTENANCE', // Bakım
    'MATERIAL_WAIT', // Malzeme bekleme
    'TOOL_CHANGE', // Takım değişimi
    'OPERATOR_BREAK', // Operatör molası
    'SETUP', // Kurulum
    'OTHER' // Diğer
]);

// Quality Control - Kalite kontrol sonuçları
export const qcResultEnum = pgEnum('qc_result', [
    'PASS', // Geçti
    'FAIL', // Başarısız
    'PARTIAL' // Kısmi geçti
]);

// ==================== TYPE EXPORTS ====================
// Use these types for type-safe enum value handling

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
