-- Migration: 20261022000000_admin_hardening.sql
-- Description: Creates admin_users, admin_audit_log, and admin_settings tables with strict Row Level Security (RLS) and indexes.
-- NOTE: Execute in Supabase SQL Editor.

BEGIN;

-- 1. Create admin_users table: decides admin role on the server only.
-- Role can be 'super_admin', 'admin', or 'moderator'.
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sessions_valid_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure sessions_valid_after exists on existing tables
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS sessions_valid_after TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Index on role for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 2. Create admin_audit_log table: records every admin write action
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit query performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);

-- 3. Create admin_settings table: system configuration & feature flags
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed baseline default settings
INSERT INTO admin_settings (key, value, description)
VALUES 
  ('ai_tutor_enabled', 'true'::jsonb, 'Toggle student AI chemistry tutor feature availability'),
  ('maintenance_banner', '{"enabled": false, "message": "Scheduled laboratory maintenance in progress."}'::jsonb, 'Public maintenance notice banner'),
  ('review_auto_moderation_level', '"moderate"'::jsonb, 'Automatic review moderation filter sensitivity (conservative, moderate, permissive)')
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS) on all admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies
-- Direct public/anon access is completely DENIED.
-- Only service-role (backend server) or super_admins can query or write.
DROP POLICY IF EXISTS "No client direct access to admin_users" ON admin_users;
CREATE POLICY "No client direct access to admin_users"
  ON admin_users
  FOR ALL
  TO public
  USING (false);

DROP POLICY IF EXISTS "No client direct access to admin_audit_log" ON admin_audit_log;
CREATE POLICY "No client direct access to admin_audit_log"
  ON admin_audit_log
  FOR ALL
  TO public
  USING (false);

-- Public can read specific public settings (e.g., maintenance banner and AI tutor status)
DROP POLICY IF EXISTS "Public can read public settings" ON admin_settings;
CREATE POLICY "Public can read public settings"
  ON admin_settings
  FOR SELECT
  TO public
  USING (key IN ('ai_tutor_enabled', 'maintenance_banner'));

COMMIT;

-- ============================================================================
-- HOW TO CREATE THE FIRST ADMIN IN SUPABASE:
-- 1. Sign up the user account in Chemora or create a user in Supabase Auth -> Users
--    (e.g., your-admin@yourdomain.edu with a strong 12+ character password).
-- 2. Copy the newly created user's UUID (id column in auth.users).
-- 3. Run the following SQL command in Supabase SQL Editor:
--
--    INSERT INTO admin_users (user_id, role)
--    VALUES ('<PASTE-USER-UUID-HERE>', 'super_admin');
--
-- 4. The user is now an authorized Chemora administrator and can log in at /admin.
-- ============================================================================
