ALTER TABLE "ml_models" ADD COLUMN "global_explanations" jsonb;--> statement-breakpoint
ALTER TABLE "ml_predictions" ADD COLUMN "local_explanation" jsonb;