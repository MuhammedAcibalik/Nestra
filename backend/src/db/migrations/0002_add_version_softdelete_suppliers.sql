-- ==================== MIGRATION: 0002_add_version_softdelete_suppliers ====================
-- Date: 2024-12-28
-- Description: Add optimistic locking (version), soft delete (deleted_at), and supplier tables
-- ==================================================================================

-- ==================== PART 1: ADD NEW COLUMNS ====================

-- Orders table: Add version and deleted_at
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Stock items table: Add version and deleted_at
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Cutting jobs table: Add version and deleted_at
ALTER TABLE cutting_jobs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE cutting_jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- ==================== PART 2: SOFT DELETE INDEXES ====================

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_items_active ON stock_items(tenant_id, quantity) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cutting_jobs_active ON cutting_jobs(tenant_id, status) WHERE deleted_at IS NULL;

-- ==================== PART 3: SUPPLIER TABLES ====================

-- Supplier status enum
DO $$ BEGIN
    CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_id TEXT,
    status supplier_status DEFAULT 'active' NOT NULL,
    payment_terms INTEGER DEFAULT 30, -- Days
    currency TEXT DEFAULT 'TRY',
    notes TEXT,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

-- Supplier indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);

-- ==================== PART 4: PURCHASE ORDER TABLES ====================

-- Purchase order status enum
DO $$ BEGIN
    CREATE TYPE purchase_order_status AS ENUM (
        'draft', 'pending_approval', 'approved', 'ordered', 
        'partially_received', 'received', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    created_by_id UUID NOT NULL REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    status purchase_order_status DEFAULT 'draft' NOT NULL,
    order_date TIMESTAMP DEFAULT NOW() NOT NULL,
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    total_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    payment_terms INTEGER,
    shipping_address TEXT,
    notes TEXT,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);

-- Purchase order indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_type_id UUID NOT NULL REFERENCES material_types(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    thickness REAL,
    width REAL,
    height REAL,
    length REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Purchase order items indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_material_id ON purchase_order_items(material_type_id);

-- ==================== PART 5: LINK STOCK WITH PURCHASE ====================

-- Add purchase reference to stock_items
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS purchase_order_item_id UUID REFERENCES purchase_order_items(id);
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- ==================== PART 6: FOREIGN KEY FIX ====================

-- Add FK constraint for order_items.material_type_id if not exists
DO $$ BEGIN
    ALTER TABLE order_items 
        ADD CONSTRAINT fk_order_items_material_type 
        FOREIGN KEY (material_type_id) REFERENCES material_types(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==================== COMPLETED ====================
