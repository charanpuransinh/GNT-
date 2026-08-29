-- M03 Device & Platform Migration
-- Version: 1.0.0
-- Created: 2026-08-23
-- Team: A4-APPLE

BEGIN;

-- Create tables
\i schema.sql

-- Insert default deployment settings for existing companies
-- (Would be done via seed script in production)

COMMIT;
