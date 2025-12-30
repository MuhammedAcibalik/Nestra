-- ==================== MIGRATION: 0003_add_rbac_tables ====================
-- Date: 2024-12-28
-- Description: Add Role-Based Access Control tables
-- ==================================================================================

-- ==================== ENUMS ====================

DO $$ BEGIN
    CREATE TYPE permission_category AS ENUM (
        'orders', 'stock', 'production', 'optimization', 'reports',
        'users', 'settings', 'suppliers', 'machines', 'customers',
        'analytics', 'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_action AS ENUM (
        'create', 'read', 'update', 'delete', 'approve', 'export', 'import', 'manage'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==================== PERMISSIONS TABLE ====================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category permission_category NOT NULL,
    action permission_action NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- ==================== ROLE PERMISSIONS (MANY-TO-MANY) ====================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT role_permission_unique UNIQUE (role_id, permission_id)
);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ==================== TENANT ROLES (CUSTOM ROLES PER TENANT) ====================

CREATE TABLE IF NOT EXISTS tenant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system TEXT DEFAULT 'false',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT tenant_role_name UNIQUE (tenant_id, name)
);

-- Tenant roles indexes
CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant_id ON tenant_roles(tenant_id);

-- ==================== TENANT ROLE PERMISSIONS ====================

CREATE TABLE IF NOT EXISTS tenant_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT tenant_role_permission_unique UNIQUE (tenant_role_id, permission_id)
);

-- Tenant role permissions indexes
CREATE INDEX IF NOT EXISTS idx_tenant_role_permissions_role_id ON tenant_role_permissions(tenant_role_id);
CREATE INDEX IF NOT EXISTS idx_tenant_role_permissions_permission_id ON tenant_role_permissions(permission_id);

-- ==================== SEED DEFAULT PERMISSIONS ====================

INSERT INTO permissions (code, name, description, category, action) VALUES
-- Orders
('orders:create', 'Create Orders', 'Create new orders', 'orders', 'create'),
('orders:read', 'View Orders', 'View orders and details', 'orders', 'read'),
('orders:update', 'Update Orders', 'Modify existing orders', 'orders', 'update'),
('orders:delete', 'Delete Orders', 'Remove orders', 'orders', 'delete'),
('orders:approve', 'Approve Orders', 'Approve orders for production', 'orders', 'approve'),

-- Stock
('stock:create', 'Add Stock', 'Add new stock items', 'stock', 'create'),
('stock:read', 'View Stock', 'View stock inventory', 'stock', 'read'),
('stock:update', 'Update Stock', 'Modify stock quantities', 'stock', 'update'),
('stock:delete', 'Delete Stock', 'Remove stock items', 'stock', 'delete'),

-- Production
('production:create', 'Start Production', 'Start new production runs', 'production', 'create'),
('production:read', 'View Production', 'View production logs', 'production', 'read'),
('production:update', 'Update Production', 'Modify production data', 'production', 'update'),

-- Optimization
('optimization:create', 'Run Optimization', 'Execute optimization scenarios', 'optimization', 'create'),
('optimization:read', 'View Optimization', 'View optimization results', 'optimization', 'read'),
('optimization:approve', 'Approve Plans', 'Approve cutting plans', 'optimization', 'approve'),

-- Reports
('reports:read', 'View Reports', 'Access all reports', 'reports', 'read'),
('reports:export', 'Export Reports', 'Export reports to files', 'reports', 'export'),

-- Users
('users:create', 'Create Users', 'Add new users', 'users', 'create'),
('users:read', 'View Users', 'View user list', 'users', 'read'),
('users:update', 'Update Users', 'Modify user accounts', 'users', 'update'),
('users:delete', 'Delete Users', 'Remove users', 'users', 'delete'),
('users:manage', 'Manage Users', 'Full user management', 'users', 'manage'),

-- Suppliers
('suppliers:create', 'Add Suppliers', 'Add new suppliers', 'suppliers', 'create'),
('suppliers:read', 'View Suppliers', 'View supplier list', 'suppliers', 'read'),
('suppliers:update', 'Update Suppliers', 'Modify suppliers', 'suppliers', 'update'),
('suppliers:delete', 'Delete Suppliers', 'Remove suppliers', 'suppliers', 'delete'),

-- Admin
('admin:manage', 'System Admin', 'Full system administration', 'admin', 'manage')
ON CONFLICT (code) DO NOTHING;

-- ==================== COMPLETED ====================
