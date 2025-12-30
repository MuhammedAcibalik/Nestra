-- Migration: Add MAB and Canary columns to ml_experiments
-- Date: 2025-12-28
-- Description: Adds experiment_type enum, mab_state and canary_state JSONB columns

-- Add new enum for experiment types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ml_experiment_type') THEN
        CREATE TYPE ml_experiment_type AS ENUM (
            'ab_test',
            'mab_epsilon',
            'mab_ucb',
            'mab_thompson',
            'canary'
        );
    END IF;
END$$;

-- Add experiment_type column with default 'ab_test'
ALTER TABLE ml_experiments 
ADD COLUMN IF NOT EXISTS experiment_type ml_experiment_type NOT NULL DEFAULT 'ab_test';

-- Add mab_state JSONB column for Multi-Arm Bandit state
-- Structure: { strategy, epsilon?, totalPulls, arms[], lastUpdated }
ALTER TABLE ml_experiments 
ADD COLUMN IF NOT EXISTS mab_state JSONB;

-- Add canary_state JSONB column for Canary deployment state
-- Structure: { stage, trafficBasisPoints, errorThreshold, samples, errors, etc }
ALTER TABLE ml_experiments 
ADD COLUMN IF NOT EXISTS canary_state JSONB;

-- Add check constraint for valid MAB state structure (optional validation)
COMMENT ON COLUMN ml_experiments.experiment_type IS 'Type of experiment: ab_test, mab_epsilon, mab_ucb, mab_thompson, or canary';
COMMENT ON COLUMN ml_experiments.mab_state IS 'Multi-Arm Bandit state: strategy, arms with pulls/rewards, epsilon for epsilon-greedy';
COMMENT ON COLUMN ml_experiments.canary_state IS 'Canary deployment state: stage, traffic percentage, error tracking, rollback info';

-- Create index for experiment type queries
CREATE INDEX IF NOT EXISTS idx_ml_experiments_type ON ml_experiments(experiment_type);

-- Update existing experiments to have default experiment type
-- (Already handled by DEFAULT, but explicit for safety)
UPDATE ml_experiments SET experiment_type = 'ab_test' WHERE experiment_type IS NULL;
