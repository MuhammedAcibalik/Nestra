DO $$ BEGIN
    CREATE TYPE "ml_job_status" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ml_training_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_type" "ml_model_type" NOT NULL,
	"status" "ml_job_status" DEFAULT 'pending' NOT NULL,
	"config" jsonb NOT NULL,
	"trigger_reason" text,
	"worker_id" text,
	"new_model_version" text,
	"metrics" jsonb,
	"error" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
