-- Migration: 20261020000000_baseline_schema.sql
-- Description: Baseline schema definition for profiles, researcher_progress, and chemora_reviews
-- Sets up table structures, unique constraints, foreign keys, and baseline RLS policies.

BEGIN;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Researcher',
  avatar_url TEXT NOT NULL DEFAULT '/favicon.png',
  rank_title TEXT NOT NULL DEFAULT 'Novice Alchemist',
  levels_cleared INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profile metadata" ON public.profiles;
CREATE POLICY "Public can view profile metadata"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Researcher Progress Table
CREATE TABLE IF NOT EXISTS public.researcher_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  experiments_completed INT NOT NULL DEFAULT 0,
  challenges_completed INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  total_xp INT NOT NULL DEFAULT 0,
  rank_title TEXT NOT NULL DEFAULT 'Novice Alchemist',
  completed_experiment_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_researcher_progress_user_id ON public.researcher_progress(user_id);

ALTER TABLE public.researcher_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.researcher_progress;
CREATE POLICY "Users can view own progress"
  ON public.researcher_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Direct client updates/inserts disabled; all progress mutations go through service-role backend

-- 3. Baseline Chemora Reviews Table
CREATE TABLE IF NOT EXISTS public.chemora_reviews (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Verified Chemist',
  role TEXT NOT NULL DEFAULT 'Chemistry Learner',
  avatar_url TEXT DEFAULT '/favicon.png',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT DEFAULT 'General Experience',
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  would_recommend BOOLEAN NOT NULL DEFAULT TRUE,
  helpful INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chemora_reviews_status ON public.chemora_reviews(status);
CREATE INDEX IF NOT EXISTS idx_chemora_reviews_created_at ON public.chemora_reviews(created_at DESC);

COMMIT;
