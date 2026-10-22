-- Migration: 20261022020000_admin_audit_logs.sql
-- Description: Creates and standardizes the custom 'admin_audit_logs' table in Supabase
-- with Row Level Security (RLS), high-performance query indexes, and sync with legacy tables.

BEGIN;

-- 1. Create the primary admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for audit query performance and filtering
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON public.admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target);

-- 3. Strict Row Level Security (RLS)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny direct public or anon access (only backend service_role can read/write)
DROP POLICY IF EXISTS "No client direct access to admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "No client direct access to admin_audit_logs"
  ON public.admin_audit_logs
  FOR ALL
  TO public
  USING (false);

-- 4. Backward-compatibility: if admin_audit_log (singular) already exists, copy any existing rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_audit_log'
  ) THEN
    INSERT INTO public.admin_audit_logs (id, admin_id, admin_email, action, target, metadata, ip, created_at)
    SELECT id, admin_id, admin_email, action, target, metadata, ip, created_at
    FROM public.admin_audit_log
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

COMMIT;
