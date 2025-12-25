/**
 * Database Indexes for Performance Optimization
 * Run with: npx drizzle-kit generate && npx drizzle-kit migrate
 * Or manually apply the SQL below
 */

/*
 * Multi-tenant support indexes
 * These indexes improve query performance for tenant-scoped queries
 */

-- Orders table
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Stock items table
CREATE INDEX IF NOT EXISTS idx_stock_items_tenant_id ON stock_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_material_type ON stock_items(material_type_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_location ON stock_items(location_id);

-- Cutting jobs table
CREATE INDEX IF NOT EXISTS idx_cutting_jobs_tenant_id ON cutting_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cutting_jobs_status ON cutting_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cutting_jobs_material_thickness ON cutting_jobs(material_type_id, thickness);

-- Optimization scenarios table
CREATE INDEX IF NOT EXISTS idx_optimization_scenarios_tenant_id ON optimization_scenarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_optimization_scenarios_status ON optimization_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_optimization_scenarios_cutting_job ON optimization_scenarios(cutting_job_id);

-- Cutting plans table  
CREATE INDEX IF NOT EXISTS idx_cutting_plans_status ON cutting_plans(status);
CREATE INDEX IF NOT EXISTS idx_cutting_plans_scenario ON cutting_plans(scenario_id);

-- Production logs table
CREATE INDEX IF NOT EXISTS idx_production_logs_tenant_id ON production_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_status ON production_logs(status);
CREATE INDEX IF NOT EXISTS idx_production_logs_cutting_plan ON production_logs(cutting_plan_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_operator ON production_logs(operator_id);

-- Activities table (collaboration)
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_user ON activities(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_target ON activities(target_type, target_id);

-- Document locks table (collaboration)
CREATE INDEX IF NOT EXISTS idx_document_locks_tenant_id ON document_locks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_locks_user ON document_locks(locked_by);
CREATE INDEX IF NOT EXISTS idx_document_locks_expires ON document_locks(expires_at);

-- Tenant users table
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_user ON tenant_users(tenant_id, user_id);
