-- Migration: A/B Testing Infrastructure
-- Created: 2024-12-28
-- Description: Creates ml_experiments table, adds experiment tracking to ml_predictions

-- ===========================================
-- 1) ENUM TYPES
-- ===========================================

DO $$ BEGIN
  CREATE TYPE ml_experiment_status AS ENUM ('active', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ml_scope_type AS ENUM ('global', 'tenant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ml_variant AS ENUM ('control', 'variant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- 2) ML_EXPERIMENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS ml_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model identification
  model_type ml_model_type NOT NULL,
  
  -- Status
  status ml_experiment_status NOT NULL DEFAULT 'paused',

  -- Scope
  scope_type ml_scope_type NOT NULL DEFAULT 'global',
  scope_tenant_id UUID NULL,

  -- Model references
  control_model_id UUID NOT NULL REFERENCES ml_models(id),
  variant_model_id UUID NOT NULL REFERENCES ml_models(id),

  -- Traffic allocation (basis points: 0-10000, where 10000 = 100%)
  allocation_basis_points INT NOT NULL DEFAULT 0,
  salt TEXT NOT NULL,

  -- Time window
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NULL,

  -- Audit
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 3) CHECK CONSTRAINTS
-- ===========================================

-- Scope tenant ID must be set for tenant scope, NULL for global
ALTER TABLE ml_experiments
  DROP CONSTRAINT IF EXISTS ck_scope_tenant_id;
ALTER TABLE ml_experiments
  ADD CONSTRAINT ck_scope_tenant_id CHECK (
    (scope_type = 'global' AND scope_tenant_id IS NULL)
    OR
    (scope_type = 'tenant' AND scope_tenant_id IS NOT NULL)
  );

-- Allocation basis points must be between 0 and 10000
ALTER TABLE ml_experiments
  DROP CONSTRAINT IF EXISTS ck_allocation_bps;
ALTER TABLE ml_experiments
  ADD CONSTRAINT ck_allocation_bps CHECK (
    allocation_basis_points >= 0 AND allocation_basis_points <= 10000
  );

-- End date must be after start date (if set)
ALTER TABLE ml_experiments
  DROP CONSTRAINT IF EXISTS ck_dates;
ALTER TABLE ml_experiments
  ADD CONSTRAINT ck_dates CHECK (
    end_date IS NULL OR start_date <= end_date
  );

-- ===========================================
-- 4) PARTIAL UNIQUE INDEXES (Tek Aktif Deney Kuralı)
-- ===========================================

-- Global scope: only one active experiment per model_type
CREATE UNIQUE INDEX IF NOT EXISTS ux_ml_exp_active_global
ON ml_experiments (model_type)
WHERE status = 'active' AND scope_type = 'global';

-- Tenant scope: only one active experiment per model_type + tenant
CREATE UNIQUE INDEX IF NOT EXISTS ux_ml_exp_active_tenant
ON ml_experiments (model_type, scope_tenant_id)
WHERE status = 'active' AND scope_type = 'tenant';

-- ===========================================
-- 5) PERFORMANCE INDEX
-- ===========================================

CREATE INDEX IF NOT EXISTS ix_ml_exp_lookup
ON ml_experiments (status, model_type, scope_tenant_id);

-- ===========================================
-- 6) TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ml_experiments_updated_at ON ml_experiments;
CREATE TRIGGER trg_ml_experiments_updated_at
BEFORE UPDATE ON ml_experiments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enforce status transition: completed is terminal
CREATE OR REPLACE FUNCTION enforce_experiment_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
    RAISE EXCEPTION 'Cannot transition from completed to %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ml_exp_status_transition ON ml_experiments;
CREATE TRIGGER trg_ml_exp_status_transition
BEFORE UPDATE OF status ON ml_experiments
FOR EACH ROW EXECUTE FUNCTION enforce_experiment_status_transition();

-- ===========================================
-- 7) ML_PREDICTIONS TABLE MODIFICATIONS
-- ===========================================

-- Add experiment tracking columns (NULLABLE for zero-downtime migration)
ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS experiment_id UUID NULL REFERENCES ml_experiments(id) ON DELETE SET NULL;

ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS assigned_variant ml_variant NULL;

ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS served_variant ml_variant NULL;

ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS model_id_used UUID NULL REFERENCES ml_models(id) ON DELETE SET NULL;

ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS error_code TEXT NULL;

-- Index for experiment analysis
CREATE INDEX IF NOT EXISTS ix_ml_predictions_experiment
ON ml_predictions (experiment_id, created_at);

-- Index for variant comparison
CREATE INDEX IF NOT EXISTS ix_ml_predictions_variant
ON ml_predictions (served_variant, created_at);
