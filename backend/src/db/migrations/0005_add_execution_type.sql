DO $$ BEGIN
    CREATE TYPE "ml_execution_type" AS ENUM ('primary', 'shadow', 'fallback');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ml_predictions" ADD COLUMN IF NOT EXISTS "execution_type" "ml_execution_type" DEFAULT 'primary' NOT NULL;
