-- Migration: add missing enum labels used by application
-- Run with: psql -h <host> -U <user> -d <db> -f migrations/0001-add-missing-statuses.sql

DO $$
BEGIN
  -- opportunity_status: ensure 'draft' exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'opportunity_status' AND e.enumlabel = 'draft'
  ) THEN
    ALTER TYPE public.opportunity_status ADD VALUE 'draft';
  END IF;

  -- contract_status_v2: ensure 'draft', 'waiting_hr_confirm', 'approved', 'deployed', 'executing' exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'contract_status_v2' AND e.enumlabel = 'draft'
  ) THEN
    ALTER TYPE public.contract_status_v2 ADD VALUE 'draft';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'contract_status_v2' AND e.enumlabel = 'waiting_hr_confirm'
  ) THEN
    ALTER TYPE public.contract_status_v2 ADD VALUE 'waiting_hr_confirm';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'contract_status_v2' AND e.enumlabel = 'approved'
  ) THEN
    ALTER TYPE public.contract_status_v2 ADD VALUE 'approved';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'contract_status_v2' AND e.enumlabel = 'deployed'
  ) THEN
    ALTER TYPE public.contract_status_v2 ADD VALUE 'deployed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'contract_status_v2' AND e.enumlabel = 'executing'
  ) THEN
    ALTER TYPE public.contract_status_v2 ADD VALUE 'executing';
  END IF;

  -- project_status_v2: ensure 'planned' and 'ready' exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'project_status_v2' AND e.enumlabel = 'planned'
  ) THEN
    ALTER TYPE public.project_status_v2 ADD VALUE 'planned';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'project_status_v2' AND e.enumlabel = 'ready'
  ) THEN
    ALTER TYPE public.project_status_v2 ADD VALUE 'ready';
  END IF;

  -- opportunity_status: ensure 'waiting_bod_approval' exists (some dumps may use different labels)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'opportunity_status' AND e.enumlabel = 'waiting_bod_approval'
  ) THEN
    ALTER TYPE public.opportunity_status ADD VALUE 'waiting_bod_approval';
  END IF;

EXCEPTION WHEN undefined_function THEN
  -- In some older Postgres deployments the ADD VALUE IF NOT EXISTS pattern is not supported inside DO blocks.
  RAISE NOTICE 'Migration helper: your Postgres may not support enum checks inside DO blocks. Run a manual migration if needed.';
END$$;

-- End migration
