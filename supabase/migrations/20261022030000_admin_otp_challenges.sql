-- Migration: 20261022030000_admin_otp_challenges.sql
-- Description: Creates public.admin_otp_challenges table with Row Level Security (RLS) enabled for mandatory admin email OTP verification.
-- NOTE: Table is already created in production; this migration documents schema parity.

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  consumed_at TIMESTAMPTZ,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound index for fast lookup of active unconsumed challenges
CREATE INDEX IF NOT EXISTS idx_admin_otp_challenges_user_active
  ON public.admin_otp_challenges(user_id, consumed_at, expires_at);

-- Enable Row Level Security (Strict server/service-role access only)
ALTER TABLE public.admin_otp_challenges ENABLE ROW LEVEL SECURITY;

-- No public or authenticated user policies exist; access is exclusively via service_role client.

COMMIT;
