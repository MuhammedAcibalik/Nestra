/**
 * Drizzle ORM - Database Indexes
 * Performance optimization indexes for tenant isolation and common queries
 */

import { index, pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

// ==================== TENANT ISOLATION INDEXES ====================
// These indexes ensure efficient tenant-scoped queries across all tables

// Note: Drizzle creates indexes differently - we define them in the table definitions
// This file documents the index strategy and can be used for raw SQL migrations

/**
 * INDEX STRATEGY DOCUMENTATION
 * 
 * == Tenant Isolation Indexes ==
 * Every table with tenant_id should have: idx_{table}_tenant_id
 * 
 * == Status + Tenant Composite Indexes ==
 * - orders: (tenant_id, status, created_at DESC)
 * - cutting_jobs: (tenant_id, status, created_at DESC)
 * - production_logs: (tenant_id, status, completed_at DESC)
 * - optimization_scenarios: (tenant_id, status, created_at DESC)
 * 
 * == Stock Performance Indexes ==
 * - stock_items: (tenant_id, material_type_id, location_id)
 * - stock_items: (tenant_id, quantity) WHERE quantity > 0
 * 
 * == Date Range Indexes ==
 * - orders: (tenant_id, created_at DESC)
 * - production_logs: (tenant_id, completed_at DESC)
 * - audit_logs: (tenant_id, created_at DESC)
 */

// ==================== RAW SQL MIGRATION ====================
// Execute these in a migration file or directly in PostgreSQL

export const indexMigrationSQL = `
-- ==================== TENANT ISOLATION ====================
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cutting_jobs_tenant_id ON cutting_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_tenant_id ON stock_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_tenant_id ON production_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_optimization_scenarios_tenant_id ON optimization_scenarios(tenant_id);

-- ==================== STATUS + TENANT COMPOSITES ====================
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_created ON orders(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cutting_jobs_tenant_status ON cutting_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_production_logs_tenant_status ON production_logs(tenant_id, status);

-- ==================== STOCK PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_stock_items_material_location 
    ON stock_items(tenant_id, material_type_id, location_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_available 
    ON stock_items(tenant_id, quantity) WHERE quantity > 0;
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_id ON stock_movements(stock_item_id);

-- ==================== DATE RANGE QUERIES ====================
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_logs_completed_at 
    ON production_logs(tenant_id, completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(tenant_id, created_at DESC);

-- ==================== FOREIGN KEY LOOKUPS ====================
CREATE INDEX IF NOT EXISTS idx_cutting_job_items_job_id ON cutting_job_items(cutting_job_id);
CREATE INDEX IF NOT EXISTS idx_cutting_job_items_order_item_id ON cutting_job_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_cutting_plans_scenario_id ON cutting_plans(scenario_id);
CREATE INDEX IF NOT EXISTS idx_cutting_plan_stocks_plan_id ON cutting_plan_stocks(cutting_plan_id);
CREATE INDEX IF NOT EXISTS idx_downtime_logs_production_id ON downtime_logs(production_log_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_id ON quality_checks(production_log_id);

-- ==================== UNIQUE BUSINESS KEYS ====================
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_items_code ON stock_items(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cutting_plans_plan_number ON cutting_plans(plan_number);
`;

// ==================== DRIZZLE INDEX DEFINITIONS ====================
// For tables that need inline index definitions

export const createIndexes = {
    // Orders
    ordersStatus: 'CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status)',

    // Cutting Jobs
    cuttingJobsStatus: 'CREATE INDEX IF NOT EXISTS idx_cutting_jobs_tenant_status ON cutting_jobs(tenant_id, status)',

    // Stock Items
    stockAvailable: 'CREATE INDEX IF NOT EXISTS idx_stock_items_available ON stock_items(tenant_id, quantity) WHERE quantity > 0',
    stockMaterialLocation: 'CREATE INDEX IF NOT EXISTS idx_stock_items_material_location ON stock_items(tenant_id, material_type_id, location_id)',

    // Production Logs
    productionStatus: 'CREATE INDEX IF NOT EXISTS idx_production_logs_tenant_status ON production_logs(tenant_id, status)'
};
